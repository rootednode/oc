// Define the Collection model using Sequelize, a promise-based ORM for Node.js
//  This model represents a collection with an auto-incrementing primary key, title,
//  description, content, and timestamps for creation and update
module.exports = (sequelize, DataTypes) => {
  const Collection = sequelize.define("Collection", {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    content: {
      type: DataTypes.TEXT,
    },
  });

  // Define the association between the 'Collection' and 'Result' models
  // A Collection has many Results, and the foreign key is 'surveyId' in the Result model
  // The source key is 'id' in the Collection model, and the association is named 'results'
  Collection.associate = (models) => {
    Collection.hasMany(models.Result, {
      foreignKey: "surveyId",
      sourceKey: "id",
      as: "results",
    });
  };

  return Collection;
};
