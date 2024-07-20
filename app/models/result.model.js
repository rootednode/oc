module.exports = (sequelize, DataTypes) => {
  const Result = sequelize.define("Result", {
    surveyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    surveyResult: {
      type: DataTypes.TEXT,
    },
    surveyResultText: {
      type: DataTypes.TEXT,
    },
  });

  // Define the association between 'Result' and 'Collection' models
  Result.associate = (models) => {
    Result.belongsTo(models.Collection, {
      foreignKey: "surveyId",
      as: "collection",
    });
  };

  return Result;
};
