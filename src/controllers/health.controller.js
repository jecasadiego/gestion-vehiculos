const { resolvedDbPath } = require("../config/database");

const getHealth = (req, res) => {
  return res.status(200).json({
    ok: true,
    data: {
      service: "Autos Colombia API",
      status: "up",
      timestamp: new Date().toISOString(),
      databasePath: resolvedDbPath,
    },
  });
};

module.exports = {
  getHealth,
};
