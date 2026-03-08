module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Payment",
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
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      payment_method: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      period: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      paid_at: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "payments",
    }
  );
};
