/**
 * Module export for the Express router instance
 * @param {Object} app - The Express application instance
 * @returns {void}
 */
module.exports = (app) => {
  // Import the Express module to create an instance of the Express.js framework
  const express = require("express");



  // Import the collection controller module, which handles database operations
  const collection = require("../controllers/collection.controller.js");

  // Create a new instance of the Express router
  const router = express.Router();

  // Login
  router.post("/login", collection.login);

  /**
   * GET request to retrieve all collection items
   * @returns {Array} An array of all collection objects
   */
  router.get("/get-all", collection.findAll);

  /**
   * GET request to retrieve a single collection item by its ID
   * @param {number} id - The ID of the collection item to retrieve
   * @returns {Object} The collection object with the matching ID
   */
  router.get("/get-one-raw/:id", collection.findOneRaw);
  router.get("/get-one/:id", collection.findOne);

  /**
   * POST request to create a new collection item
   * @param {Object} req.body - The collection data to be stored
   * @returns {Object} The newly created collection object
   */
  router.post("/create", collection.create);

  /**
   * PUT request to update an existing collection item by its ID
   * @param {number} id - The ID of the collection item to update
   * @param {Object} req.body - The updated collection data
   * @returns {Object} The updated collection object
   */
  router.put("/update/:id", collection.updateOne);

  /**
   * DELETE request to delete a single collection item by its ID
   * @param {number} id - The ID of the collection item to delete
   * @returns {Object} The deleted collection object
   */
  router.delete("/delete-one/:id", collection.deleteOne);

  /**
   * DELETE request to delete all collection items
   * @returns {number} The number of deleted collection items
   */
  router.delete("/delete-all", collection.deleteAll);


  // Mount the router to the '/api/collection' path
  app.use("/api/collection", router);
};
