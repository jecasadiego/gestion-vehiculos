const { ok, created } = require("../utils/http");
const { listPayments, createPayment } = require("../services/payments.service");

const listPaymentsController = async (req, res) => {
  const payments = await listPayments(req.query.plate);
  return ok(res, payments, { total: payments.length });
};

const createPaymentController = async (req, res) => {
  const payment = await createPayment(req.body || {});
  return created(res, payment);
};

module.exports = {
  listPaymentsController,
  createPaymentController,
};
