/**
 * Module export for the Express router instance
 * @param {Object} app - The Express application instance
 * @returns {void}
 */
module.exports = (app) => {
  // Import the Express module to create an instance of the Express.js framework
  const express = require("express");



  // Import the tables controller module, which handles database operations
  const tables = require("../controllers/tables.controller.js");

  // Create a new instance of the Express router
  const router = express.Router();

	// get a list of customtables
	router.get("/:id", tables.findAll);
	//router.get("/:id", tables.findAll);

	// get a tables info from the customtable list
	//router.get("/get-one/:id", tables.findOne);
	router.get("/info/:id", tables.findOne);
  
	// get a complete table by name
	router.get("/data/:name", tables.getcustomtable);
	//router.get("/:name", tables.getcustomtable);

  router.post("/import", tables.import);

  // Mount the router to the '/api/tables' path
  app.use("/api/tables", router);
};
