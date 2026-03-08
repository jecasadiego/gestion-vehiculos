module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Vehicle",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      plate: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
        },
      },
      owner_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_monthly: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      monthly_status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Activa",
        validate: {
          isIn: [["Activa", "Inactiva", "Pendiente"]],
        },
      },
      created_at: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "vehicles",
    }
  );
};
