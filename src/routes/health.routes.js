const express = require("express");
const { asyncHandler } = require("../utils/http");
const { getHealth } = require("../controllers/health.controller");

const router = express.Router();

router.get("/health", asyncHandler(getHealth));

module.exports = router;
