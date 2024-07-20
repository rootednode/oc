// Define the Tokens model using Sequelize, a promise-based ORM for Node.js
//  This model represents a collection with an auto-incrementing primary key, title,
//  description, content, and timestamps for creation and update
module.exports = (sequelize, DataTypes) => {

const Tokens = sequelize.define('Tokens', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: 'tokens',
  timestamps: false,
});


  // Define the association between the 'Tokens' and 'Result' models
  // A Tokens has many Results, and the foreign key is 'surveyId' in the Result model
  // The source key is 'id' in the Tokens model, and the association is named 'results'
/*  Tokens.associate = (models) => {
    Tokens.hasMany(models.Result, {
      foreignKey: "surveyId",
      sourceKey: "id",
      as: "results",
    });
  };*/

  return Tokens;
};
