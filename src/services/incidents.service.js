const { Incident, Vehicle, Stay } = require("../models");
const { AppError } = require("../utils/errors");
const { normalizePlate, isValidPlate } = require("../utils/plate");

const mapIncident = (row) => ({
  id: row.id,
  description: row.description,
  createdAt: row.created_at,
  vehicle: {
    id: row.vehicle.id,
    plate: row.vehicle.plate,
    ownerName: row.vehicle.owner_name,
  },
  stayId: row.stay_id,
});

const listIncidents = async (plateInput) => {
  const plate = normalizePlate(plateInput);
  const vehicleWhere = plate ? { plate } : undefined;

  const rows = await Incident.findAll({
    include: [
      {
        model: Vehicle,
        as: "vehicle",
        attributes: ["id", "plate", "owner_name"],
        where: vehicleWhere,
        required: Boolean(vehicleWhere),
      },
    ],
    order: [["created_at", "DESC"]],
  });

  return rows.map((row) => mapIncident(row.get({ plain: true })));
};

const createIncident = async (payload) => {
  const plate = normalizePlate(payload.plate);
  const description = String(payload.description || "").trim();

  if (!isValidPlate(plate)) {
    throw new AppError(400, "VEHICLE_PLATE_INVALID", "Placa invalida");
  }
  if (!description) {
    throw new AppError(
      400,
      "INCIDENT_DESCRIPTION_REQUIRED",
      "La descripcion de la novedad es obligatoria"
    );
  }

  const vehicle = await Vehicle.findOne({ where: { plate } });
  if (!vehicle) {
    throw new AppError(404, "VEHICLE_NOT_FOUND", "Vehiculo no encontrado");
  }

  const activeStay = await Stay.findOne({
    where: {
      vehicle_id: vehicle.id,
      status: "active",
    },
  });

  const incident = await Incident.create({
    vehicle_id: vehicle.id,
    stay_id: activeStay ? activeStay.id : null,
    description,
    created_at: new Date().toISOString(),
  });

  const withVehicle = await Incident.findByPk(incident.id, {
    include: [
      {
        model: Vehicle,
        as: "vehicle",
        attributes: ["id", "plate", "owner_name"],
      },
    ],
  });

  return mapIncident(withVehicle.get({ plain: true }));
};

module.exports = {
  listIncidents,
  createIncident,
};
