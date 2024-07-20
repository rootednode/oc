module.exports = {
  HOST: "127.0.0.1",
  USER: "forms",
  PASSWORD: "042142kaos", // Replace with your actual password
  DB: "forms",
  dialect: "mysql",
  // pool: {
  //   max: 5,
  //   min: 0,
  //   acquire: 30000,
  //   idle: 10000,
  // },
  // Add error handling
  async connect() {
    try {
      await sequelize.authenticate();
      console.log("Connection has been established successfully.");
    } catch (error) {
      console.error("Unable to connect to the database:", error);
    }
  },
};

// module.exports = {
//   HOST: "127.0.0.1",
//   USER: "root",
//   PASSWORD: "",
//   DB: "test",
//   dialect: "mysql",
//   // pool: {
//   //   max: 5,
//   //   min: 0,
//   //   acquire: 30000,
//   //   idle: 10000,
//   // },
//   // Add error handling
//   async connect() {
//     try {
//       await sequelize.authenticate();
//       console.log("Connection has been established successfully.");
//     } catch (error) {
//       console.error("Unable to connect to the database:", error);
//     }
//   },
// };
