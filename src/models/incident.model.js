module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Incident",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      vehicle_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "vehicles",
          key: "id",
        },
      },
      stay_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "stays",
          key: "id",
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      created_at: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "incidents",
    }
  );
};
