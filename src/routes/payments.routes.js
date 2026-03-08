const express = require("express");
const { asyncHandler } = require("../utils/http");
const {
  listPaymentsController,
  createPaymentController,
} = require("../controllers/payments.controller");

const router = express.Router();

router.get("/", asyncHandler(listPaymentsController));
router.post("/", asyncHandler(createPaymentController));

module.exports = router;
