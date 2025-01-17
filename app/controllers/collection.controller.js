const db = require("../models");
const Survey = db.collection;
const Modules = db.modules;
const Users = db.users;
const Tokens = db.tokens;
const Op = db.Sequelize.Op;

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'your_secret_key'; // Replace with your actual secret key




// Function to find pages for a given id
function getPagesById(id, modules) {
  // Find the module with the matching id
  const module = modules.find((mod) => mod.dataValues.id === id);

  if (!module) {
    console.log(`Module with id ${id} not found.`);
    return null;
  }

  // Parse the content field
  const content = JSON.parse(module.dataValues.content);

  // Return the pages
  return content.pages;
}




// Function to update collection content with modules
function updateCollectionWithModules(collection, modules) {
  // Parse the collection content
  const parsedSurvey = JSON.parse(collection.dataValues.content);

  // Create a map for quick module lookup
  const moduleMap = modules.reduce((map, module) => {
    const id = module.dataValues.id;
    const moduleContent = JSON.parse(module.dataValues.content);
    map[id] = moduleContent;
    return map;
  }, {});

  // Traverse survey pages and elements to update fields
  parsedSurvey.pages.forEach((page) => {
    page.elements.forEach((element) => {
      if (element.title && element.title.startsWith("@")) {
        // Extract the module id and question name
				console.log('matching:', element.title);
        const match = element.title.match(/^@(\d+):([\w-]+)/);
        if (match) {
          const moduleId = parseInt(match[1], 10);
          const questionName = match[2];

          console.log(`Processing element: ${element.title}`);
          console.log(`Extracted moduleId: ${moduleId}, questionName: ${questionName}`);

          // Look up the module by id
          const moduleContent = moduleMap[moduleId];

					console.log("Module Map:", JSON.stringify(moduleMap, null, 2));
					console.log("Module Content:", JSON.stringify(moduleContent, null, 2));
          if (moduleContent) {
            // Find the corresponding question in the module
            const matchingQuestion = moduleContent.pages
              .flatMap((modulePage) => modulePage.elements)
              .find((moduleElement) => moduleElement.name === questionName);

            if (matchingQuestion) {
              // Overwrite the element with the question data
              console.log(`Found matching question in module:`, matchingQuestion);
              Object.assign(element, matchingQuestion);
              element.updatedFromModule = true; // Optional flag
            } else {
              console.log(`No matching question found in module ${moduleId} for name ${questionName}`);
            }
          } else {
            console.log(`No module found with id ${moduleId}`);
          }
        } else {
          console.log(`Title format invalid: ${element.title}`);
        }
      }
    });
  });

  // Convert back to string and update the collection content
  collection.dataValues.content = JSON.stringify(parsedSurvey, null, 2);
}

















async function validateToken(token) {
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const tokenRecord = await Tokens.findOne({
      where: { token, userId: decoded.userId },
      attributes: ['token', 'userId', 'expiresAt']
    });

    if (!tokenRecord) {
			console.log('token not found');
      return { valid: false, error: 'Token not found' };
    }

    if (new Date() > tokenRecord.expiresAt) {
			console.log('token expired');
      return { valid: false, error: 'Token expired' };
    }

    const userRecord = await Users.findOne({
      where: { id: tokenRecord.userId },
      attributes: ['admin']
    });

    if (!userRecord) {
      return { valid: false, error: 'User not found' };
			console.log('user not found');
    }

    return { valid: true, userId: decoded.userId, admin: userRecord.admin };

  } catch (error) {
    console.log('Error validating token:', error);
    return { valid: false, error: 'Invalid token' };
  }
}

async function findAllUsers() {
  try {
    const users = await Users.findAll();
    console.log('users:', users);
    return users;
  } catch (error) {
    console.error('Error executing query:', error);
  }
}

async function createUser(username, password, admin) {
  try {

    // Check if the user already exists
    const existingUser = await Users.findOne({ where: { username } });
    if (existingUser) {
      console.error('User already exists');
      return;
    }


    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await Users.create({ username, password: hashedPassword, admin: admin});
    console.log('User created:', user);
  } catch (error) {
    console.error('Error creating user:', error);
  }
}

async function login(username, password) {
  try {
    const user = await Users.findOne({ where: { username } });
    if (!user) {
      return { error: 'User not found' };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return { error: 'Invalid password' };
    }

    const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '48h' });

    await Tokens.create({
      userId: user.id,
      token: token,
      expiresAt: new Date(Date.now() + (2*24*60*60*1000)), // 2 day expiry
    });

    return { token: token, admin: user.admin };
  } catch (error) {
    console.error('Error during login:', error);
    return { error: 'An error occurred during login' };
  }
}

async function logout(token) {
  try {
    const result = await Tokens.destroy({ where: { token } });
    if (result === 0) {
      console.log('Token not found, logout failed');
      return { success: false, message: 'Token not found' };
    }
    console.log('Logout successful');
    return { success: true, message: 'Logout successful' };
  } catch (error) {
    console.error('Error during logout:', error);
    return { success: false, message: 'An error occurred during logout' };
  }
}

// Create and Save a new survey
exports.create = async (req, res) => {
  if (!req.body.title) {
    return res.status(400).send({ message: "Content can not be empty!" });
  }

  console.log('create', req.headers);
  const token = req.headers.authorization;
  const validResult = await validateToken(token);

  if (!validResult.valid || validResult.admin !== 1) {
    return res.status(403).send({ message: validResult.error || "Unauthorized" });
  }

  try {
    const survey = {
      title: req.body.title,
      description: req.body.description,
      content: JSON.stringify(req.body.content),
    };

    const data = await Survey.create(survey);
    res.send(data);
  } catch (err) {
    res.status(500).send({ message: err.message || "Some error occurred while creating the Forms." });
  }
};

// Retrieve all surveys from the database.
exports.findAll = async (req, res) => {
  const title = req.query.title;
  const token = req.headers.authorization;
  const validResult = await validateToken(token);

  if (!validResult.valid || validResult.admin !== 1) {
    return res.status(403).send({ message: validResult.error || "Unauthorized" });
  }

  try {
    const condition = title ? { title: { [Op.like]: `%${title}%` } } : null;
    const data = await Survey.findAll({ where: condition });

    if (data.length > 0) {
      res.send(data);
    } else {
      res.status(400).send({ message: "Cannot find survey. Empty data." });
    }
  } catch (err) {
    res.status(500).send({ message: err.message || "Some error occurred while retrieving Forms." });
  }
};

// Find a single survey with an id
exports.findOneRaw = async (req, res) => {
  const id = req.params.id;
  const token = req.headers.authorization;
  const validResult = await validateToken(token);

  if (!validResult.valid) {
    return res.status(403).send({ message: validResult.error || "Unauthorized" });
  }

  try {
    const data = await Survey.findByPk(id);
    if (data) {

			console.log('findone');

			//console.log(data);

			try {
    		//const modules = await Modules.findAll({ });
				//const updatedsurvey = updateCollectionWithModules(data, modules);

			} catch (error) {
				console.log(error);
			}
			//const combined = await combineSurveyAndModules(data);

  	  // Return the combined result
	    //res.status(200).json({ survey, matchedModules });

      res.send(data);
      //res.send(updatedsurvey);

    } else {
			console.log('err');
      res.status(404).send({ message: `Cannot find Form with id=${id}.` });
    }
  } catch (err) {
    res.status(500).send({ message: `Error retrieving Form with id=${id}.` });
  }
};


// Find a single survey with an id
exports.findOne = async (req, res) => {
  const id = req.params.id;
  const token = req.headers.authorization;
  const validResult = await validateToken(token);

  if (!validResult.valid) {
    return res.status(403).send({ message: validResult.error || "Unauthorized" });
  }

  try {
    const data = await Survey.findByPk(id);
    if (data) {

			console.log('findone');

			//console.log(data);

			try {
    		const modules = await Modules.findAll({ });
				const updatedsurvey = updateCollectionWithModules(data, modules);

			} catch (error) {
				console.log(error);
			}
			//const combined = await combineSurveyAndModules(data);

  	  // Return the combined result
	    //res.status(200).json({ survey, matchedModules });

      res.send(data);
      //res.send(updatedsurvey);

    } else {
			console.log('err');
      res.status(404).send({ message: `Cannot find Form with id=${id}.` });
    }
  } catch (err) {
    res.status(500).send({ message: `Error retrieving Form with id=${id}.` });
  }
};

// Update a survey by the id in the request
exports.updateOne = async (req, res) => {
  const id = req.params.id;
  const token = req.headers.authorization;
  const validResult = await validateToken(token);

  if (!validResult.valid) {
    return res.status(403).send({ message: validResult.error || "Unauthorized" });
  }

  //const newContent = JSON.stringify(req.body.content); // Assuming new content is sent in the request body
  const newContent = JSON.stringify(req.body); // Assuming new content is sent in the request body
  if (!newContent) {
    return res.status(400).send({ message: "Content to update cannot be empty" });
  }

  try {
    const num = await Survey.update({ content: newContent }, { where: { id: id } });
    if (num == 1) {
      res.send({ message: "Form was updated successfully." });
    } else {
      res.send({ message: `Cannot update Form with id=${id}. Maybe Form was not found or req.body is empty!` });
    }
  } catch (err) {
    res.status(500).send({ message: `Error updating Form with id=${id}.` });
  }
};

// Delete a survey with the specified id in the request
exports.deleteOne = async (req, res) => {
  const id = req.params.id;
  const token = req.headers.authorization;
  const validResult = await validateToken(token);

  if (!validResult.valid) {
    return res.status(403).send({ message: validResult.error || "Unauthorized" });
  }

  try {
    const num = await Survey.destroy({ where: { id: id } });
    if (num == 1) {
      res.send({ message: "Form was deleted successfully!" });
    } else {
      res.send({ message: `Cannot delete Form with id=${id}. Maybe Form was not found!` });
    }
  } catch (err) {
    res.status(500).send({ message: `Could not delete Form with id=${id}.` });
  }
};

// Delete all surveys from the database.
exports.deleteAll = async (req, res) => {
  const id = req.params.id;
  const token = req.headers.authorization;
  const validResult = await validateToken(token);

  if (!validResult.valid) {
    return res.status(403).send({ message: validResult.error || "Unauthorized" });
  }

  try {
    const nums = await Survey.destroy({ where: {}, truncate: false });
    res.send({ message: `${nums} Forms were deleted successfully!` });
  } catch (err) {
    res.status(500).send({ message: err.message || "Some error occurred while removing all surveys." });
  }
};

// Login
exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {

		//createUser(username, password, 1);

    const result = await login(username, password);
    if (result.error) {
      console.error('Login failed:', result.error);
      res.status(400).send('Login failed');
    } else {
      console.log('Login successful, token:', result.token);
      res.send(result);
    }
  } catch (error) {
    res.status(500).send({ error: 'An error occurred during login' });
  }
};

