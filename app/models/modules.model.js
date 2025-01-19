module.exports = (sequelize, DataTypes) => {
  const Modules = sequelize.define("Modules", {
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

  // Define the association between the 'Modules' and 'Result' models
  // A Modules has many Results, and the foreign key is 'surveyId' in the Result model
  // The source key is 'id' in the Modules model, and the association is named 'results'
  Modules.associate = (models) => {
    Modules.hasMany(models.Result, {
      foreignKey: "surveyId",
      sourceKey: "id",
      as: "results",
    });
  };

  return Modules;
};
