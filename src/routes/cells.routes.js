const express = require("express");
const { asyncHandler } = require("../utils/http");
const {
  listCellsController,
  getCellByCodeController,
  updateCellStatusController,
} = require("../controllers/cells.controller");

const router = express.Router();

router.get("/", asyncHandler(listCellsController));
router.get("/:code", asyncHandler(getCellByCodeController));
router.put("/:id/status", asyncHandler(updateCellStatusController));

module.exports = router;
