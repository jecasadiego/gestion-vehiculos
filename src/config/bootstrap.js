const { sequelize, ParkingCell } = require("../models");

const seedParkingCells = async () => {
  const total = await ParkingCell.count();
  if (total > 0) {
    return;
  }

  const now = new Date().toISOString();
  const payload = [];
  for (let i = 1; i <= 100; i += 1) {
    payload.push({
      code: `A${i}`,
      status: "available",
      created_at: now,
    });
  }
  await ParkingCell.bulkCreate(payload);
};

const initializeDatabase = async () => {
  await sequelize.authenticate();
  await sequelize.sync();
  await seedParkingCells();
};

module.exports = {
  initializeDatabase,
};
