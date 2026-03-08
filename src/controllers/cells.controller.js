const { AppError } = require("../utils/errors");
const { ok } = require("../utils/http");
const {
  getAllCells,
  getCellByCode,
  updateCellStatus,
} = require("../services/cells.service");

const listCellsController = async (req, res) => {
  const data = await getAllCells();
  if (String(req.query.view || "").toLowerCase() === "summary") {
    return ok(res, data.summary);
  }
  return ok(res, data);
};

const getCellByCodeController = async (req, res) => {
  const cell = await getCellByCode(req.params.code);
  return ok(res, cell);
};

const updateCellStatusController = async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    throw new AppError(400, "CELL_ID_INVALID", "Id de celda invalido");
  }

  const cell = await updateCellStatus(id, req.body || {});
  return ok(res, cell);
};

module.exports = {
  listCellsController,
  getCellByCodeController,
  updateCellStatusController,
};
