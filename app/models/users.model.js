// Define the Users model using Sequelize, a promise-based ORM for Node.js
//  This model represents a collection with an auto-incrementing primary key, title,
//  description, content, and timestamps for creation and update
module.exports = (sequelize, DataTypes) => {
  const Users = sequelize.define("Users", {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    admin: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

  });

  // Define the association between the 'Users' and 'Result' models
  // A Users has many Results, and the foreign key is 'surveyId' in the Result model
  // The source key is 'id' in the Users model, and the association is named 'results'
/*  Users.associate = (models) => {
    Users.hasMany(models.Result, {
      foreignKey: "surveyId",
      sourceKey: "id",
      as: "results",
    });
  };*/

  return Users;
};
