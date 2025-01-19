/**
 * Module export for the Express router instance
 * @param {Object} app - The Express application instance
 * @returns {void}
 */
module.exports = (app) => {
  // Import the Express module to create an instance of the Express.js framework
  const express = require("express");

	//const bodyParser = require('body-parser');
	//app.use(bodyParser.json({ limit: '50mb' }));
	//app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));


  // Import the users controller module, which handles database operations
  const users = require("../controllers/users.controller.js");

  // Create a new instance of the Express router
  const router = express.Router();

  // Login
  router.post("/login", users.login);

  /**
   * GET request to retrieve all users items
   * @returns {Array} An array of all users objects
   */
  router.get("/get-all", users.findAll);

  /**
   * GET request to retrieve a single users item by its ID
   * @param {number} id - The ID of the users item to retrieve
   * @returns {Object} The users object with the matching ID
   */
  router.get("/get-one/:id", users.findOne);

  /**
   * POST request to create a new users item
   * @param {Object} req.body - The users data to be stored
   * @returns {Object} The newly created users object
   */
  router.post("/create", users.create);

  /**
   * PUT request to update an existing users item by its ID
   * @param {number} id - The ID of the users item to update
   * @param {Object} req.body - The updated users data
   * @returns {Object} The updated users object
   */
  router.put("/update/:id", users.updateOne);

  /**
   * DELETE request to delete a single users item by its ID
   * @param {number} id - The ID of the users item to delete
   * @returns {Object} The deleted users object
   */
  router.delete("/delete-one/:id", users.deleteOne);

  /**
   * DELETE request to delete all users items
   * @returns {number} The number of deleted users items
   */
  router.delete("/delete-all", users.deleteAll);


  // Mount the router to the '/api/users' path
  app.use("/api/users", router);
};
