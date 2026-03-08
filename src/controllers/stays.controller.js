const { ok, created } = require("../utils/http");
const {
  listActiveStays,
  getActiveStayByPlate,
  listStayHistory,
  registerEntry,
  registerExit,
} = require("../services/stays.service");

const listActiveStaysController = async (req, res) => {
  const stays = await listActiveStays(req.query.plate);
  return ok(res, stays, { total: stays.length });
};

const getActiveStayByPlateController = async (req, res) => {
  const stay = await getActiveStayByPlate(req.params.plate);
  return ok(res, stay);
};

const listStayHistoryController = async (req, res) => {
  const history = await listStayHistory(req.query.limit);
  return ok(res, history.items, { total: history.items.length, limit: history.limit });
};

const registerEntryController = async (req, res) => {
  const stay = await registerEntry(req.body || {});
  return created(res, stay);
};

const registerExitController = async (req, res) => {
  const result = await registerExit(req.body || {});
  return ok(res, result);
};

module.exports = {
  listActiveStaysController,
  getActiveStayByPlateController,
  listStayHistoryController,
  registerEntryController,
  registerExitController,
};
