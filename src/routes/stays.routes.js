const express = require("express");
const { asyncHandler } = require("../utils/http");
const {
  listActiveStaysController,
  getActiveStayByPlateController,
  listStayHistoryController,
  registerEntryController,
  registerExitController,
} = require("../controllers/stays.controller");

const router = express.Router();

router.get("/active", asyncHandler(listActiveStaysController));
router.get("/active/:plate", asyncHandler(getActiveStayByPlateController));
router.get("/history", asyncHandler(listStayHistoryController));
router.post("/entry", asyncHandler(registerEntryController));
router.post("/exit", asyncHandler(registerExitController));

module.exports = router;
