const db = require("../models"); // Import models from the database
const Result = db.result; // Define the Result model
const Op = db.Sequelize.Op; // Define the Sequelize operation

/**
 * Create a new Result instance
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {void}
 */

exports.create = (req, res) => {
	console.log(req);
  // Check if postId is present in the request body
  if (!req.body.postId) {
    res.status(400).send({
      message: "Content can not be empty!",
    });
    return;
  }

  // Create a new Result object
  const surveyResult = JSON.stringify(req.body.surveyResult);
  const result = {
    surveyId: req.body.postId,
    surveyResult: surveyResult,
    surveyResultText: req.body.surveyResultText,
  };
  // Create a new Result instance with the Result object
  Result.create(result)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
			console.log(err);
      // Send an error message if creation fails
      res.status(500).send({
        message: err.message || "Some error occurred while creating the Forms.",
      });
    });
};

/**
 * Retrieve all Result instances
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {void}
 */
exports.findAll = (req, res) => {
	//console.log(req);
  // Retrieve all Result instances
  Result.findAll()
    .then((data) => {
      if (data.length > 0) {
        res.send(data);
      } else {
        // Log a message if no data is found
        res.send(console.log("hello survey"));
      }
    })
    .catch((err) => {
      // Send an error message if retrieval fails
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving Forms.",
      });
    });
};

/**
 * Retrieve a single Result instance by id
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {void}
 */
exports.findOne = async (req, res) => {
  try {
    // Retrieve the Result instance by id
    const id = req.params.id;
    const data = await Result.findByPk(id);

    if (!data) {
      // Send an error message if the Result instance is not found
      return res.status(404).send({
        message: `Cannot find Form with id=${id}.`,
      });
    }

    // Parse the surveyResult JSON string
    const surveyResult = JSON.parse(data.surveyResult);
    const surveyResultArray = Object.keys(surveyResult).map((key) => ({
      [key]: surveyResult[key],
    }));

    // Create a response object with the id and surveyResultArray
    const response = {
      id: data.id,
      surveyResult: surveyResultArray,
    };

    return res.send(response);
  } catch (err) {
    // Send an error message if retrieval fails
    return res.status(500).send({
      message: "Error retrieving Form with id=" + req.params.id,
    });
  }
};

/**
 * Retrieve all Result instances by postId
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {void}
 */
exports.findAllById = (req, res) => {

  // Retrieve the postId from the request parameters
  const id = req.params.id;
  if (!id) {
    // Send an error message if the id is not provided
    return res.status(400).send({
      message: "ID parameter is required to retrieve data by ID.",
    });
  }

  // Retrieve all Result instances with the postId
  Result.findAll({
    where: { surveyId: id },
  })
    .then((data) => {


      if (data.length > 0) {
        // Parse the surveyResult JSON strings

				console.log(data);
        const dataArray = data.map((item) => ({
          id: item.id,
          surveyResult: JSON.parse(item.surveyResult),
        }));

        res.send(dataArray);
      } else {
        // Send a message if no data is found
        res.send("No data found for the provided ID.");
      }
    })
    .catch((err) => {
      // Send an error message if retrieval fails
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving data by ID.",
      });
    });
};

exports.update = (req, res) => {
  const newData = req.body.data;

  newData.forEach(async (item) => {
    const itemId = item.id;
    const newSurveyResult = JSON.stringify(item.surveyResult);

    try {
      await Result.update(
        { surveyResult: newSurveyResult },
        { where: { id: itemId } }
      );
    } catch (err) {
      return res.status(500).send({
        message: "Error updating Result with id=" + itemId,
      });
    }
  });

  res.send({
    message: "Results were updated successfully.",
  });
};
