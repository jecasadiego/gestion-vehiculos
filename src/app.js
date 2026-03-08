const path = require("node:path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { initializeDatabase } = require("./config/bootstrap");
const { requestIdMiddleware } = require("./middlewares/request-id.middleware");
const { apiNotFoundMiddleware } = require("./middlewares/not-found.middleware");
const { errorMiddleware } = require("./middlewares/error.middleware");
const healthRoutes = require("./routes/health.routes");
const usersRoutes = require("./routes/users.routes");
const vehiclesRoutes = require("./routes/vehicles.routes");
const cellsRoutes = require("./routes/cells.routes");
const staysRoutes = require("./routes/stays.routes");
const incidentsRoutes = require("./routes/incidents.routes");
const paymentsRoutes = require("./routes/payments.routes");

const startupPromise = initializeDatabase();

const app = express();
app.locals.startupPromise = startupPromise;

app.use(cors());
app.use(requestIdMiddleware);
app.use(express.json());
app.use(morgan("dev"));

app.use(async (req, res, next) => {
  try {
    await startupPromise;
    next();
  } catch (error) {
    next(error);
  }
});

app.use(express.static(path.resolve(__dirname, "../public")));

app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../public/index.html"));
});

app.use("/api/v1", healthRoutes);
app.use("/api/v1/users", usersRoutes);
app.use("/api/v1/vehicles", vehiclesRoutes);
app.use("/api/v1/cells", cellsRoutes);
app.use("/api/v1/stays", staysRoutes);
app.use("/api/v1/incidents", incidentsRoutes);
app.use("/api/v1/payments", paymentsRoutes);

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return apiNotFoundMiddleware(req, res, next);
  }
  return res.status(404).send("Recurso no encontrado");
});

app.use(errorMiddleware);

module.exports = app;
