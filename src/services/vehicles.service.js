const { Vehicle, Op } = require("../models");
const { AppError } = require("../utils/errors");
const { normalizePlate, isValidPlate } = require("../utils/plate");

const ALLOWED_MONTHLY_STATUS = new Set(["Activa", "Inactiva", "Pendiente"]);

const parseMonthlyStatus = (value) => {
  const status = String(value || "Activa").trim();
  if (!ALLOWED_MONTHLY_STATUS.has(status)) {
    throw new AppError(
      400,
      "VEHICLE_MONTHLY_STATUS_INVALID",
      "Estado mensual invalido"
    );
  }
  return status;
};

const mapVehicle = (row) => ({
  id: row.id,
  plate: row.plate,
  ownerName: row.owner_name,
  phone: row.phone,
  isMonthly: Boolean(row.is_monthly),
  monthlyStatus: row.monthly_status,
  createdAt: row.created_at,
});

const validateVehiclePayload = (plate, ownerName) => {
  if (!isValidPlate(plate)) {
    throw new AppError(400, "VEHICLE_PLATE_INVALID", "Placa invalida");
  }
  if (!ownerName) {
    throw new AppError(
      400,
      "VEHICLE_OWNER_NAME_REQUIRED",
      "El nombre del cliente es obligatorio"
    );
  }
};

const listVehicles = async (plateQuery) => {
  const normalized = normalizePlate(plateQuery);
  const where = normalized
    ? {
        plate: {
          [Op.like]: `%${normalized}%`,
        },
      }
    : {};

  const rows = await Vehicle.findAll({
    where,
    order: [["id", "DESC"]],
  });

  return rows.map((row) => mapVehicle(row.get({ plain: true })));
};

const getVehicleById = async (id) => {
  const vehicle = await Vehicle.findByPk(id);
  if (!vehicle) {
    throw new AppError(404, "VEHICLE_NOT_FOUND", "Vehiculo no encontrado");
  }
  return mapVehicle(vehicle.get({ plain: true }));
};

const getVehicleByPlate = async (plateInput) => {
  const plate = normalizePlate(plateInput);
  if (!isValidPlate(plate)) {
    throw new AppError(400, "VEHICLE_PLATE_INVALID", "Placa invalida");
  }

  const vehicle = await Vehicle.findOne({
    where: { plate },
  });
  if (!vehicle) {
    throw new AppError(404, "VEHICLE_NOT_FOUND", "Vehiculo no encontrado");
  }
  return mapVehicle(vehicle.get({ plain: true }));
};

const createVehicle = async (payload) => {
  const plate = normalizePlate(payload.plate);
  const ownerName = String(payload.ownerName || "").trim();
  const phone = String(payload.phone || "").trim() || null;
  const isMonthly =
    typeof payload.isMonthly === "boolean" ? payload.isMonthly : true;
  const monthlyStatus = parseMonthlyStatus(payload.monthlyStatus);

  validateVehiclePayload(plate, ownerName);

  const duplicated = await Vehicle.findOne({ where: { plate } });
  if (duplicated) {
    throw new AppError(
      409,
      "VEHICLE_PLATE_DUPLICATED",
      "Ya existe un vehiculo con esa placa"
    );
  }

  const vehicle = await Vehicle.create({
    plate,
    owner_name: ownerName,
    phone,
    is_monthly: isMonthly,
    monthly_status: monthlyStatus,
    created_at: new Date().toISOString(),
  });

  return mapVehicle(vehicle.get({ plain: true }));
};

const updateVehicle = async (id, payload) => {
  const plate = normalizePlate(payload.plate);
  const ownerName = String(payload.ownerName || "").trim();
  const phone = String(payload.phone || "").trim() || null;
  const isMonthly =
    typeof payload.isMonthly === "boolean" ? payload.isMonthly : true;
  const monthlyStatus = parseMonthlyStatus(payload.monthlyStatus);

  validateVehiclePayload(plate, ownerName);

  const vehicle = await Vehicle.findByPk(id);
  if (!vehicle) {
    throw new AppError(404, "VEHICLE_NOT_FOUND", "Vehiculo no encontrado");
  }

  const duplicated = await Vehicle.findOne({
    where: {
      plate,
      id: { [Op.ne]: id },
    },
  });
  if (duplicated) {
    throw new AppError(
      409,
      "VEHICLE_PLATE_DUPLICATED",
      "Ya existe otro vehiculo con esa placa"
    );
  }

  await vehicle.update({
    plate,
    owner_name: ownerName,
    phone,
    is_monthly: isMonthly,
    monthly_status: monthlyStatus,
  });

  return mapVehicle(vehicle.get({ plain: true }));
};

module.exports = {
  listVehicles,
  getVehicleById,
  getVehicleByPlate,
  createVehicle,
  updateVehicle,
  parseMonthlyStatus,
  mapVehicle,
};
