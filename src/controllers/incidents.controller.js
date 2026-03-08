const { ok, created } = require("../utils/http");
const { listIncidents, createIncident } = require("../services/incidents.service");

const listIncidentsController = async (req, res) => {
  const incidents = await listIncidents(req.query.plate);
  return ok(res, incidents, { total: incidents.length });
};

const createIncidentController = async (req, res) => {
  const incident = await createIncident(req.body || {});
  return created(res, incident);
};

module.exports = {
  listIncidentsController,
  createIncidentController,
};
