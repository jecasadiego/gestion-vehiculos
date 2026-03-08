module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Stay",
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
      cell_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "parking_cells",
          key: "id",
        },
      },
      entry_time: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      exit_time: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("active", "closed"),
        allowNull: false,
        defaultValue: "active",
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "stays",
    }
  );
};
