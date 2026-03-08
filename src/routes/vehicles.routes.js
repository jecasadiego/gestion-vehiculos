const express = require("express");
const { asyncHandler } = require("../utils/http");
const {
  listVehiclesController,
  getVehicleByIdController,
  getVehicleByPlateController,
  createVehicleController,
  updateVehicleController,
} = require("../controllers/vehicles.controller");

const router = express.Router();

router.get("/", asyncHandler(listVehiclesController));
router.get("/plate/:plate", asyncHandler(getVehicleByPlateController));
router.get("/:id", asyncHandler(getVehicleByIdController));
router.post("/", asyncHandler(createVehicleController));
router.put("/:id", asyncHandler(updateVehicleController));

module.exports = router;
