module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "ParkingCell",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
        },
      },
      status: {
        type: DataTypes.ENUM("available", "occupied"),
        allowNull: false,
        defaultValue: "available",
      },
      vehicle_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "vehicles",
          key: "id",
        },
      },
      created_at: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "parking_cells",
    }
  );
};
