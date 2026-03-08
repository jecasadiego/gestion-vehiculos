const path = require("node:path");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

process.env.DB_PATH = path.join("data", `test-${Date.now()}.db`);

const app = require("../src/app");

test("API operativa completa", async () => {
  const api = request(app);

  const health = await api.get("/api/v1/health");
  assert.equal(health.status, 200);
  assert.equal(health.body.ok, true);

  const createUser = await api.post("/api/v1/users").send({
    fullName: "Operario Principal",
    document: "11111111",
    phone: "3000000000",
  });
  assert.equal(createUser.status, 201);
  assert.equal(createUser.body.data.document, "11111111");

  const createVehicle = await api.post("/api/v1/vehicles").send({
    plate: "HUO123",
    ownerName: "Carlos Cardenas",
    phone: "3110001000",
    isMonthly: true,
    monthlyStatus: "Activa",
  });
  assert.equal(createVehicle.status, 201);
  assert.equal(createVehicle.body.data.plate, "HUO123");

  const listCells = await api.get("/api/v1/cells");
  assert.equal(listCells.status, 200);
  assert.equal(listCells.body.data.summary.total, 100);
  assert.equal(listCells.body.data.summary.available, 100);

  const entry = await api.post("/api/v1/stays/entry").send({
    plate: "HUO123",
    cellCode: "A1",
    note: "Ingreso de prueba",
  });
  assert.equal(entry.status, 201);
  assert.equal(entry.body.data.cell.code, "A1");
  assert.equal(entry.body.data.status, "active");

  const activeStay = await api.get("/api/v1/stays/active/HUO123");
  assert.equal(activeStay.status, 200);
  assert.equal(activeStay.body.data.vehicle.plate, "HUO123");

  const incident = await api.post("/api/v1/incidents").send({
    plate: "HUO123",
    description: "Golpe leve en puerta trasera",
  });
  assert.equal(incident.status, 201);
  assert.equal(incident.body.data.vehicle.plate, "HUO123");

  const payment = await api.post("/api/v1/payments").send({
    plate: "HUO123",
    amount: 150000,
    paymentMethod: "Transferencia",
    period: "2026-03",
    description: "Pago mensual de prueba",
  });
  assert.equal(payment.status, 201);
  assert.equal(payment.body.data.amount, 150000);

  const exit = await api.post("/api/v1/stays/exit").send({
    plate: "HUO123",
    payment: {
      amount: 5000,
      paymentMethod: "Efectivo",
      description: "Cargo salida prueba",
    },
  });
  assert.equal(exit.status, 200);
  assert.equal(exit.body.data.stay.status, "closed");
  assert.equal(exit.body.data.payment.amount, 5000);

  const listPayments = await api.get("/api/v1/payments?plate=HUO123");
  assert.equal(listPayments.status, 200);
  assert.equal(listPayments.body.meta.total, 2);

  const listIncidents = await api.get("/api/v1/incidents?plate=HUO123");
  assert.equal(listIncidents.status, 200);
  assert.equal(listIncidents.body.meta.total, 1);

  const history = await api.get("/api/v1/stays/history");
  assert.equal(history.status, 200);
  assert.ok(history.body.meta.total >= 1);

  const invalidPlate = await api.get("/api/v1/vehicles/plate/12");
  assert.equal(invalidPlate.status, 400);
  assert.equal(invalidPlate.body.ok, false);
  assert.equal(invalidPlate.body.error.code, "VEHICLE_PLATE_INVALID");
  assert.equal(typeof invalidPlate.body.error.requestId, "string");
  assert.ok(invalidPlate.headers["x-request-id"]);

  const endpointNotFound = await api.get("/api/v1/does-not-exist");
  assert.equal(endpointNotFound.status, 404);
  assert.equal(endpointNotFound.body.ok, false);
  assert.equal(endpointNotFound.body.error.code, "ENDPOINT_NOT_FOUND");
  assert.equal(typeof endpointNotFound.body.error.message, "string");
});
