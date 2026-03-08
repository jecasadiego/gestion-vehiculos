const { ParkingCell, Vehicle, sequelize } = require("../models");
const { AppError } = require("../utils/errors");
const { normalizePlate, isValidPlate } = require("../utils/plate");

const mapCell = (row) => ({
  id: row.id,
  code: row.code,
  status: row.status,
  vehicle: row.vehicle
    ? {
        id: row.vehicle.id,
        plate: row.vehicle.plate,
        ownerName: row.vehicle.owner_name,
      }
    : null,
});

const buildSummary = (cells) => {
  const occupied = cells.filter((cell) => cell.status === "occupied").length;
  return {
    total: cells.length,
    occupied,
    available: cells.length - occupied,
  };
};

const getAllCells = async () => {
  const rows = await ParkingCell.findAll({
    include: [
      {
        model: Vehicle,
        as: "vehicle",
        required: false,
      },
    ],
    order: [["id", "ASC"]],
  });
  const cells = rows.map((row) => mapCell(row.get({ plain: true })));
  const summary = buildSummary(cells);

  return {
    summary,
    cells,
  };
};

const getCellByCode = async (codeInput) => {
  const code = String(codeInput || "").trim().toUpperCase();
  if (!code) {
    throw new AppError(400, "CELL_CODE_INVALID", "Codigo de celda invalido");
  }

  const cell = await ParkingCell.findOne({
    where: { code },
    include: [
      {
        model: Vehicle,
        as: "vehicle",
        required: false,
      },
    ],
  });

  if (!cell) {
    throw new AppError(404, "CELL_NOT_FOUND", "Celda no encontrada");
  }

  return mapCell(cell.get({ plain: true }));
};

const updateCellStatus = async (id, payload) => {
  const status = String(payload.status || "").trim().toLowerCase();
  if (!["available", "occupied"].includes(status)) {
    throw new AppError(400, "CELL_STATUS_INVALID", "Estado de celda invalido");
  }

  const result = await sequelize.transaction(async (transaction) => {
    const cell = await ParkingCell.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!cell) {
      throw new AppError(404, "CELL_NOT_FOUND", "Celda no encontrada");
    }

    if (status === "available") {
      await cell.update(
        {
          status: "available",
          vehicle_id: null,
        },
        { transaction }
      );
    } else {
      const plate = normalizePlate(payload.plate);
      if (!isValidPlate(plate)) {
        throw new AppError(
          400,
          "CELL_OCCUPY_PLATE_INVALID",
          "Debe enviar una placa valida para ocupar la celda"
        );
      }

      let vehicle = await Vehicle.findOne({
        where: { plate },
        transaction,
      });

      if (!vehicle) {
        const ownerName = String(payload.ownerName || "").trim();
        if (!ownerName) {
          throw new AppError(
            400,
            "CELL_OCCUPY_OWNER_REQUIRED",
            "Debe enviar ownerName cuando la placa no existe"
          );
        }
        vehicle = await Vehicle.create(
          {
            plate,
            owner_name: ownerName,
            phone: null,
            is_monthly: false,
            monthly_status: "Pendiente",
            created_at: new Date().toISOString(),
          },
          { transaction }
        );
      }

      await cell.update(
        {
          status: "occupied",
          vehicle_id: vehicle.id,
        },
        { transaction }
      );
    }

    const updated = await ParkingCell.findByPk(id, {
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          required: false,
        },
      ],
      transaction,
    });

    return mapCell(updated.get({ plain: true }));
  });

  return result;
};

module.exports = {
  getAllCells,
  getCellByCode,
  updateCellStatus,
};
