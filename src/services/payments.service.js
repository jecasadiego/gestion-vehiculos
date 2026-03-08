const { Payment, Vehicle, Stay } = require("../models");
const { AppError } = require("../utils/errors");
const { normalizePlate, isValidPlate } = require("../utils/plate");

const mapPayment = (row) => ({
  id: row.id,
  amount: Number(row.amount),
  paymentMethod: row.payment_method,
  period: row.period,
  description: row.description,
  paidAt: row.paid_at,
  stayId: row.stay_id,
  vehicle: {
    id: row.vehicle.id,
    plate: row.vehicle.plate,
    ownerName: row.vehicle.owner_name,
  },
});

const listPayments = async (plateInput) => {
  const plate = normalizePlate(plateInput);
  const vehicleWhere = plate ? { plate } : undefined;

  const rows = await Payment.findAll({
    include: [
      {
        model: Vehicle,
        as: "vehicle",
        attributes: ["id", "plate", "owner_name"],
        where: vehicleWhere,
        required: Boolean(vehicleWhere),
      },
    ],
    order: [["paid_at", "DESC"]],
  });

  return rows.map((row) => mapPayment(row.get({ plain: true })));
};

const createPayment = async (payload) => {
  const plate = normalizePlate(payload.plate);
  const amount = Number(payload.amount);
  const paymentMethod = String(payload.paymentMethod || "").trim();
  const period = String(payload.period || "").trim() || null;
  const description = String(payload.description || "").trim() || null;

  if (!isValidPlate(plate)) {
    throw new AppError(400, "VEHICLE_PLATE_INVALID", "Placa invalida");
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError(
      400,
      "PAYMENT_AMOUNT_INVALID",
      "El monto debe ser un numero mayor a 0"
    );
  }
  if (!paymentMethod) {
    throw new AppError(
      400,
      "PAYMENT_METHOD_REQUIRED",
      "paymentMethod es obligatorio"
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

  const payment = await Payment.create({
    vehicle_id: vehicle.id,
    stay_id: activeStay ? activeStay.id : null,
    amount,
    payment_method: paymentMethod,
    period,
    description,
    paid_at: new Date().toISOString(),
  });

  const withVehicle = await Payment.findByPk(payment.id, {
    include: [
      {
        model: Vehicle,
        as: "vehicle",
        attributes: ["id", "plate", "owner_name"],
      },
    ],
  });

  return mapPayment(withVehicle.get({ plain: true }));
};

module.exports = {
  listPayments,
  createPayment,
};
