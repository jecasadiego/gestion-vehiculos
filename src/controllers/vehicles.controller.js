const { AppError } = require("../utils/errors");
const { ok, created } = require("../utils/http");
const {
  listVehicles,
  getVehicleById,
  getVehicleByPlate,
  createVehicle,
  updateVehicle,
} = require("../services/vehicles.service");

const parseId = (idValue) => {
  const id = Number.parseInt(idValue, 10);
  if (Number.isNaN(id)) {
    throw new AppError(400, "VEHICLE_ID_INVALID", "Id de vehiculo invalido");
  }
  return id;
};

const listVehiclesController = async (req, res) => {
  const vehicles = await listVehicles(req.query.plate);
  return ok(res, vehicles, { total: vehicles.length });
};

const getVehicleByIdController = async (req, res) => {
  const id = parseId(req.params.id);
  const vehicle = await getVehicleById(id);
  return ok(res, vehicle);
};

const getVehicleByPlateController = async (req, res) => {
  const vehicle = await getVehicleByPlate(req.params.plate);
  return ok(res, vehicle);
};

const createVehicleController = async (req, res) => {
  const vehicle = await createVehicle(req.body || {});
  return created(res, vehicle);
};

const updateVehicleController = async (req, res) => {
  const id = parseId(req.params.id);
  const vehicle = await updateVehicle(id, req.body || {});
  return ok(res, vehicle);
};

module.exports = {
  listVehiclesController,
  getVehicleByIdController,
  getVehicleByPlateController,
  createVehicleController,
  updateVehicleController,
};
