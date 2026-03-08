const express = require("express");
const { asyncHandler } = require("../utils/http");
const {
  listIncidentsController,
  createIncidentController,
} = require("../controllers/incidents.controller");

const router = express.Router();

router.get("/", asyncHandler(listIncidentsController));
router.post("/", asyncHandler(createIncidentController));

module.exports = router;
