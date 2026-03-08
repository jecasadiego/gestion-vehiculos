const { Stay, Vehicle, ParkingCell, Payment, sequelize } = require("../models");
const { AppError } = require("../utils/errors");
const { normalizePlate, isValidPlate } = require("../utils/plate");
const { parseMonthlyStatus } = require("./vehicles.service");

const stayInclude = [
  {
    model: Vehicle,
    as: "vehicle",
    attributes: ["id", "plate", "owner_name", "monthly_status"],
    required: true,
  },
  {
    model: ParkingCell,
    as: "cell",
    attributes: ["id", "code"],
    required: true,
  },
];

const mapStay = (row) => ({
  id: row.id,
  entryTime: row.entry_time,
  exitTime: row.exit_time,
  status: row.status,
  note: row.note,
  vehicle: {
    id: row.vehicle.id,
    plate: row.vehicle.plate,
    ownerName: row.vehicle.owner_name,
    monthlyStatus: row.vehicle.monthly_status,
  },
  cell: {
    id: row.cell.id,
    code: row.cell.code,
  },
});

const mapPayment = (payment) =>
  payment
    ? {
        id: payment.id,
        vehicleId: payment.vehicle_id,
        stayId: payment.stay_id,
        amount: Number(payment.amount),
        paymentMethod: payment.payment_method,
        period: payment.period,
        description: payment.description,
        paidAt: payment.paid_at,
      }
    : null;

const validatePlateOrThrow = (plateInput) => {
  const plate = normalizePlate(plateInput);
  if (!isValidPlate(plate)) {
    throw new AppError(400, "VEHICLE_PLATE_INVALID", "Placa invalida");
  }
  return plate;
};

const findVehicleByPlate = async (plate, transaction) => {
  return Vehicle.findOne({
    where: { plate },
    transaction,
  });
};

const getActiveStayByVehicleId = async (vehicleId, transaction) => {
  return Stay.findOne({
    where: {
      vehicle_id: vehicleId,
      status: "active",
    },
    include: stayInclude,
    transaction,
  });
};

const getStayById = async (id, transaction) => {
  return Stay.findByPk(id, {
    include: stayInclude,
    transaction,
  });
};

const listActiveStays = async (plateInput) => {
  const plate = normalizePlate(plateInput);
  const where = {
    status: "active",
  };
  const vehicleWhere = plate ? { plate } : undefined;

  const rows = await Stay.findAll({
    where,
    include: stayInclude.map((item) =>
      item.as === "vehicle"
        ? {
            ...item,
            where: vehicleWhere,
            required: Boolean(vehicleWhere),
          }
        : item
    ),
    order: [["entry_time", "DESC"]],
  });

  return rows.map((row) => mapStay(row.get({ plain: true })));
};

const getActiveStayByPlate = async (plateInput) => {
  const plate = validatePlateOrThrow(plateInput);

  const vehicle = await findVehicleByPlate(plate);
  if (!vehicle) {
    throw new AppError(404, "VEHICLE_NOT_FOUND", "Vehiculo no encontrado");
  }

  const activeStay = await getActiveStayByVehicleId(vehicle.id);
  if (!activeStay) {
    throw new AppError(
      404,
      "ACTIVE_STAY_NOT_FOUND",
      "No hay una estancia activa para esta placa"
    );
  }

  return mapStay(activeStay.get({ plain: true }));
};

const listStayHistory = async (limitInput) => {
  const parsedLimit = Number.parseInt(limitInput || "100", 10);
  const limit = Number.isNaN(parsedLimit) ? 100 : Math.min(parsedLimit, 500);

  const rows = await Stay.findAll({
    where: {
      status: "closed",
    },
    include: stayInclude,
    order: [["exit_time", "DESC"]],
    limit,
  });

  return {
    items: rows.map((row) => mapStay(row.get({ plain: true }))),
    limit,
  };
};

const registerEntry = async (payload) => {
  const plate = validatePlateOrThrow(payload.plate);
  const cellCode = String(payload.cellCode || "").trim().toUpperCase();
  const ownerName = String(payload.ownerName || "").trim();
  const phone = String(payload.phone || "").trim() || null;
  const monthlyStatus = parseMonthlyStatus(payload.monthlyStatus);
  const isMonthly =
    typeof payload.isMonthly === "boolean" ? payload.isMonthly : true;
  const note = String(payload.note || "").trim() || null;

  if (!cellCode) {
    throw new AppError(400, "CELL_CODE_REQUIRED", "Debe enviar cellCode");
  }

  const stay = await sequelize.transaction(async (transaction) => {
    const cell = await ParkingCell.findOne({
      where: { code: cellCode },
      transaction,
    });
    if (!cell) {
      throw new AppError(404, "CELL_NOT_FOUND", "La celda no existe");
    }
    if (cell.status !== "available") {
      throw new AppError(409, "CELL_OCCUPIED", "La celda ya esta ocupada");
    }

    let vehicle = await findVehicleByPlate(plate, transaction);
    if (!vehicle) {
      if (!ownerName) {
        throw new AppError(
          400,
          "OWNER_NAME_REQUIRED",
          "Debe enviar ownerName para registrar una placa nueva"
        );
      }

      vehicle = await Vehicle.create(
        {
          plate,
          owner_name: ownerName,
          phone,
          is_monthly: isMonthly,
          monthly_status: monthlyStatus,
          created_at: new Date().toISOString(),
        },
        { transaction }
      );
    }

    const existingStay = await getActiveStayByVehicleId(vehicle.id, transaction);
    if (existingStay) {
      throw new AppError(
        409,
        "ACTIVE_STAY_ALREADY_EXISTS",
        `El vehiculo ya tiene una estancia activa en ${existingStay.cell.code}`
      );
    }

    const createdStay = await Stay.create(
      {
        vehicle_id: vehicle.id,
        cell_id: cell.id,
        entry_time: new Date().toISOString(),
        status: "active",
        note,
      },
      { transaction }
    );

    await cell.update(
      {
        status: "occupied",
        vehicle_id: vehicle.id,
      },
      { transaction }
    );

    return getStayById(createdStay.id, transaction);
  });

  return mapStay(stay.get({ plain: true }));
};

const registerExit = async (payload) => {
  const plate = validatePlateOrThrow(payload.plate);
  const paymentData =
    payload.payment && typeof payload.payment === "object" ? payload.payment : null;

  if (paymentData && Number(paymentData.amount) <= 0) {
    throw new AppError(
      400,
      "PAYMENT_AMOUNT_INVALID",
      "El monto de pago debe ser mayor a 0"
    );
  }

  const vehicle = await findVehicleByPlate(plate);
  if (!vehicle) {
    throw new AppError(404, "VEHICLE_NOT_FOUND", "Vehiculo no encontrado");
  }

  const activeStay = await getActiveStayByVehicleId(vehicle.id);
  if (!activeStay) {
    throw new AppError(
      404,
      "ACTIVE_STAY_NOT_FOUND",
      "No hay estancia activa para esta placa"
    );
  }

  const result = await sequelize.transaction(async (transaction) => {
    const now = new Date().toISOString();

    await Stay.update(
      {
        exit_time: now,
        status: "closed",
      },
      {
        where: { id: activeStay.id },
        transaction,
      }
    );

    await ParkingCell.update(
      {
        status: "available",
        vehicle_id: null,
      },
      {
        where: { id: activeStay.cell.id },
        transaction,
      }
    );

    let payment = null;
    if (paymentData) {
      const paymentMethod = String(paymentData.paymentMethod || "").trim();
      const period = String(paymentData.period || "").trim() || null;
      const description = String(paymentData.description || "").trim() || null;
      const amount = Number(paymentData.amount);

      if (!paymentMethod) {
        throw new AppError(
          400,
          "PAYMENT_METHOD_REQUIRED",
          "paymentMethod es obligatorio para registrar pago"
        );
      }

      payment = await Payment.create(
        {
          vehicle_id: vehicle.id,
          stay_id: activeStay.id,
          amount,
          payment_method: paymentMethod,
          period,
          description,
          paid_at: now,
        },
        { transaction }
      );
    }

    const closedStay = await getStayById(activeStay.id, transaction);

    return {
      stay: mapStay(closedStay.get({ plain: true })),
      payment: payment ? mapPayment(payment.get({ plain: true })) : null,
    };
  });

  return result;
};

module.exports = {
  listActiveStays,
  getActiveStayByPlate,
  listStayHistory,
  registerEntry,
  registerExit,
};
