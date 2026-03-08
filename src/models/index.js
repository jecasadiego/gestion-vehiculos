const { DataTypes, Op } = require("sequelize");
const { sequelize } = require("../config/database");
const createUserModel = require("./user.model");
const createVehicleModel = require("./vehicle.model");
const createParkingCellModel = require("./parking-cell.model");
const createStayModel = require("./stay.model");
const createIncidentModel = require("./incident.model");
const createPaymentModel = require("./payment.model");

const User = createUserModel(sequelize, DataTypes);
const Vehicle = createVehicleModel(sequelize, DataTypes);
const ParkingCell = createParkingCellModel(sequelize, DataTypes);
const Stay = createStayModel(sequelize, DataTypes);
const Incident = createIncidentModel(sequelize, DataTypes);
const Payment = createPaymentModel(sequelize, DataTypes);

Vehicle.hasMany(Stay, {
  foreignKey: "vehicle_id",
  as: "stays",
});
Stay.belongsTo(Vehicle, {
  foreignKey: "vehicle_id",
  as: "vehicle",
});

ParkingCell.hasMany(Stay, {
  foreignKey: "cell_id",
  as: "stays",
});
Stay.belongsTo(ParkingCell, {
  foreignKey: "cell_id",
  as: "cell",
});

ParkingCell.belongsTo(Vehicle, {
  foreignKey: "vehicle_id",
  as: "vehicle",
});
Vehicle.hasMany(ParkingCell, {
  foreignKey: "vehicle_id",
  as: "occupiedCells",
});

Vehicle.hasMany(Incident, {
  foreignKey: "vehicle_id",
  as: "incidents",
});
Incident.belongsTo(Vehicle, {
  foreignKey: "vehicle_id",
  as: "vehicle",
});
Stay.hasMany(Incident, {
  foreignKey: "stay_id",
  as: "incidents",
});
Incident.belongsTo(Stay, {
  foreignKey: "stay_id",
  as: "stay",
});

Vehicle.hasMany(Payment, {
  foreignKey: "vehicle_id",
  as: "payments",
});
Payment.belongsTo(Vehicle, {
  foreignKey: "vehicle_id",
  as: "vehicle",
});
Stay.hasMany(Payment, {
  foreignKey: "stay_id",
  as: "payments",
});
Payment.belongsTo(Stay, {
  foreignKey: "stay_id",
  as: "stay",
});

module.exports = {
  sequelize,
  Op,
  User,
  Vehicle,
  ParkingCell,
  Stay,
  Incident,
  Payment,
};
