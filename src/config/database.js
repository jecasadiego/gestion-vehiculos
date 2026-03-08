const fs = require("node:fs");
const path = require("node:path");
const { Sequelize } = require("sequelize");

const dbLocation = process.env.DB_PATH || path.join("data", "parking.db");
const resolvedDbPath = path.isAbsolute(dbLocation)
  ? dbLocation
  : path.resolve(process.cwd(), dbLocation);

fs.mkdirSync(path.dirname(resolvedDbPath), { recursive: true });

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: resolvedDbPath,
  logging: false,
  define: {
    freezeTableName: true,
    timestamps: false,
  },
});

module.exports = {
  sequelize,
  resolvedDbPath,
};
