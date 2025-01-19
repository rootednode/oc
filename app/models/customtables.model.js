module.exports = (sequelize, Sequelize) => {
  const CustomTables = sequelize.define("CustomTables", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    tableName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    originalFileName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
  });

  return CustomTables;
};

