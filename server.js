const express = require("express"); // Importing the express module
const cors = require("cors"); // Importing the cors module
const app = express(); // Creating an instance of the express application

// const collectionRountes = require("./app/routes/collectionRoutes"); // Importing collection routes (currently commented out)

// CORS options configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'http://10.254.0.6:3000', 'http://orgchaos.co', 'http://orgchaos.co:3000'], // Specifying allowed origins
  credentials: true, // Enabling credentials
  optionSuccessStatus: 200, // Setting the success status for OPTIONS requests
};

// Applying CORS middleware with the specified options
app.use(cors(corsOptions));

// Parse requests with content-type application/json
//app.use(express.json());

app.use(express.json({limit: '500mb'}));
app.use(express.urlencoded({limit: '500mb'}));

// Parse requests with content-type application/x-www-form-urlencoded
//app.use(express.urlencoded({ extended: true }));


// Simple route for the root URL
app.get("/", (req, res) => {
  res.json({ message: "Welcome to my application!" }); // Returning a JSON response with a welcome message
});

// Importing and applying collection routes
require("./app/routes/collectionRoutes")(app);

require("./app/routes/tablesRoutes")(app);

require("./app/routes/usersRoutes")(app);

// Importing and applying result routes
require("./app/routes/resultRoutes")(app);

// Importing the database models
const db = require("./app/models");

// Synchronizing the database using Sequelize
db.sequelize.sync();
// db.sequelize.sync({ force: true }).then(() => {
//   // Drop and re-sync the database (currently commented out)
//   // console.log("Drop and re-sync db.");
// });

// Setting the port for the application
const PORT = process.env.PORT || 3001;

// Starting the server and listening for requests
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`); // Logging a message when the server starts
});

server.timeout = 300000;

