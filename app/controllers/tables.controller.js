const db = require("../models");
const Modules = db.modules;
const Users = db.users;
const Tokens = db.tokens;
const CustomTables = db.customtables;



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


const multer = require("multer");
const csvParser = require("csv-parser"); // CSV parsing library
const stream = require("stream");
const path = require("path");

const upload = multer({ storage: multer.memoryStorage() });






exports.import = [
	upload.single("file"),
	async (req, res) => {
		console.log("Importing CSV file...");

		if (!req.file) {
			return res.status(400).send({ message: "No file uploaded!" });
		}

		const token = req.headers.authorization;
		const validResult = await validateToken(token);

		if (!validResult.valid || validResult.admin !== 1) {
			return res.status(403).send({ message: validResult.error || "Unauthorized" });
		}

		try {
			const fileBuffer = req.file.buffer;
			const fileName = path.parse(req.file.originalname).name; // Extract file name
			const sanitizedTableName = fileName.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase(); // Sanitize table name
			console.log("Sanitized Table Name:", sanitizedTableName);

			const readableStream = new stream.PassThrough();
			readableStream.end(fileBuffer);

			const rows = [];
			let headers = [];

			readableStream
				.pipe(csvParser())
				.on("headers", (headerList) => {
					headers = headerList;
				})
				.on("data", (row) => {
					rows.push(row);
				})
				.on("end", async () => {
					if (!headers.length) {
						return res.status(400).send({ message: "CSV file has no headers!" });
					}

					console.log("CSV Headers:", headers);

					try {
						// Dynamically define a Sequelize model
						const DynamicTable = db.sequelize.define(
							sanitizedTableName,
							headers.reduce((schema, header) => {
								schema[header] = {
									type: db.Sequelize.STRING, // Default to STRING
									allowNull: true,
								};
								return schema;
							}, {}),
							{
								freezeTableName: true, // Prevent Sequelize from pluralizing table names
							}

						);

						console.log("Table Name:", DynamicTable.getTableName());

						// Sync the table to the database
						await DynamicTable.sync({ force: true });
						console.log(`Table "${sanitizedTableName}" created successfully!`);

						console.log("CustomTables Model:", db.customTables);

						// Log table metadata into CustomTables
						await CustomTables.create({
							tableName: sanitizedTableName,
							originalFileName: req.file.originalname,
						});

						// Bulk insert rows
						await DynamicTable.bulkCreate(rows, { validate: true });
						console.log(`${rows.length} rows imported successfully!`);

						res.send({
							message: `${rows.length} rows successfully imported into table "${sanitizedTableName}"!`,
						});
					} catch (err) {
						console.error("Database Error:", err);
						res.status(500).send({
							message: "Error creating table or importing data.",
							error: err.message,
						});
					}
				})
				.on("error", (error) => {
					console.error("CSV Parsing Error:", error);
					res.status(500).send({ message: "Error parsing CSV file." });
				});
		} catch (error) {
			console.error("Processing Error:", error);
			res.status(500).send({ message: "Error processing file.", error: error.message });
		}
	},
];






// Create and Save a new module
exports.create = async (req, res) => {

	console.log(req.body.content);

	if (!req.body.title) {
		return res.status(400).send({ message: "Content can not be empty!" });
	}



	const token = req.headers.authorization;
	const validResult = await validateToken(token);

	if (!validResult.valid || validResult.admin !== 1) {
		return res.status(403).send({ message: validResult.error || "Unauthorized" });
	}

	try {
		const module = {
			title: req.body.title,
			description: req.body.description,
			content: req.body.content,
		};

		const data = await Modules.create(module);
		res.send(data);
	} catch (err) {
		res.status(500).send({ message: err.message || "Some error occurred while creating the Forms." });
	}
};



// Get a complete table by name
exports.getcustomtable = async (req, res) => {
  console.log('getcustomtable', req.params.name);
  const tableName = req.params.name; // Table name from request params
  const token = req.headers.authorization;

  // Validate token
  const validResult = await validateToken(token);
  if (!validResult.valid || validResult.admin !== 1) {
    return res.status(403).send({ message: validResult.error || "Unauthorized" });
  }

  // Validate the table name to prevent SQL injection
  //if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
  //  return res.status(400).send({ message: "Invalid table name" });
  //}

  try {
    // Dynamically query the table contents
    const [data, metadata] = await db.sequelize.query(`SELECT * FROM ${tableName}`);
    console.log('getcustomtable data', data);

    if (data.length > 0) {
      // Send table data
      return res.send(data);
    } else {
      // Handle empty table
      return res.status(404).send({ message: "No data found in the table." });
    }
  } catch (err) {
    console.error("Error querying table:", err);
    return res.status(500).send({ message: err.message || "An error occurred while retrieving table contents." });
  }
};





// Retrieve all modules from the database.
exports.findAll = async (req, res) => {
	const title = req.query.title;
	const token = req.headers.authorization;
	const validResult = await validateToken(token);

	if (!validResult.valid || validResult.admin !== 1) {
		return res.status(403).send({ message: validResult.error || "Unauthorized" });
	}

	try {
		const condition = title ? { title: { [Op.like]: `%${title}%` } } : null;
		const data = await CustomTables.findAll({ where: condition });

		if (data.length > 0) {
			res.send(data);
		} else {
			res.send(data);
			//res.status(400).send({ message: "Cannot find module. Empty data." });
		}
	} catch (err) {
		res.status(500).send({ message: err.message || "Some error occurred while retrieving Forms." });
	}
};




// get a tables info from the customtable list
exports.findOne = async (req, res) => {
	const id = req.params.id;
	const token = req.headers.authorization;
	const validResult = await validateToken(token);

	console.log('view', id)


	if (!validResult.valid) {
		return res.status(403).send({ message: validResult.error || "Unauthorized" });
	}

	try {
		const data = await CustomTables.findByPk(id);
		console.log(' findOne data', data)
		if (data) {
			res.send(data);
		} else {
			res.status(404).send({ message: `Cannot find Form with id=${id}.` });
		}
	} catch (err) {
		res.status(500).send({ message: `Error retrieving Form with id=${id}.` });
	}
};

// Update a module by the id in the request
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
		const num = await Modules.update({ content: newContent }, { where: { id: id } });
		if (num == 1) {
			res.send({ message: "Form was updated successfully." });
		} else {
			res.send({ message: `Cannot update Form with id=${id}. Maybe Form was not found or req.body is empty!` });
		}
	} catch (err) {
		res.status(500).send({ message: `Error updating Form with id=${id}.` });
	}
};

// Delete a module with the specified id in the request
exports.deleteOne = async (req, res) => {
	const id = req.params.id;
	const token = req.headers.authorization;
	const validResult = await validateToken(token);

	if (!validResult.valid) {
		return res.status(403).send({ message: validResult.error || "Unauthorized" });
	}

	try {
		const num = await Modules.destroy({ where: { id: id } });
		if (num == 1) {
			res.send({ message: "Form was deleted successfully!" });
		} else {
			res.send({ message: `Cannot delete Form with id=${id}. Maybe Form was not found!` });
		}
	} catch (err) {
		res.status(500).send({ message: `Could not delete Form with id=${id}.` });
	}
};

// Delete all modules from the database.
exports.deleteAll = async (req, res) => {
	const id = req.params.id;
	const token = req.headers.authorization;
	const validResult = await validateToken(token);

	if (!validResult.valid) {
		return res.status(403).send({ message: validResult.error || "Unauthorized" });
	}

	try {
		const nums = await Modules.destroy({ where: {}, truncate: false });
		res.send({ message: `${nums} Forms were deleted successfully!` });
	} catch (err) {
		res.status(500).send({ message: err.message || "Some error occurred while removing all modules." });
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

