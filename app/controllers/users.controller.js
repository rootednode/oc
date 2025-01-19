const db = require("../models");
const Users = db.users;
const Tokens = db.tokens;
const Op = db.Sequelize.Op;

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'your_secret_key'; // Replace with your actual secret key

async function validateToken(token) {
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const tokenRecord = await Tokens.findOne({
      where: { token, userId: decoded.userId },
      attributes: ['token', 'userId', 'expiresAt']
    });

    if (!tokenRecord) {
      return { valid: false, error: 'Token not found' };
    }

    if (new Date() > tokenRecord.expiresAt) {
      return { valid: false, error: 'Token expired' };
    }

    const userRecord = await Users.findOne({
      where: { id: tokenRecord.userId },
      attributes: ['admin']
    });

    if (!userRecord) {
      return { valid: false, error: 'User not found' };
    }

    return { valid: true, userId: decoded.userId, admin: userRecord.admin };

  } catch (error) {
    console.error('Error validating token:', error);
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

    const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '1h' });

    await Tokens.create({
      userId: user.id,
      token: token,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour expiry
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
  //if (!req.body.username) {
  //  return res.status(400).send({ message: "Content can not be empty!" });
  //}

  console.log('create', req.headers);
  const token = req.headers.authorization;
  const validResult = await validateToken(token);

  if (!validResult.valid || validResult.admin !== 1) {
    return res.status(403).send({ message: validResult.error || "Unauthorized" });
  }

  try {
    const user = {
      username: req.body.username,
      password: req.body.password,
      admin: req.body.admin,
      content: JSON.stringify(req.body.content),
    };


		//createUser(req.body.username, req.body.password, req.body.admin);
		const data = await Users.create(user);
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
//    const data = await Users.findAll({ where: condition });
    const data = await Users.findAll({ attributes: ['id', 'username'] });

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
exports.findOne = async (req, res) => {
  const id = req.params.id;
  const token = req.headers.authorization;
  const validResult = await validateToken(token);

  if (!validResult.valid) {
    return res.status(403).send({ message: validResult.error || "Unauthorized" });
  }

  try {
    const data = await Users.findByPk(id);
    if (data) {
      res.send(data);
    } else {
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
    const num = await Users.update({ content: newContent }, { where: { id: id } });
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
    const num = await Users.destroy({ where: { id: id } });
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
    const nums = await Users.destroy({ where: {}, truncate: false });
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

