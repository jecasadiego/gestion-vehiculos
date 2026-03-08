const { AppError } = require("../utils/errors");
const { ok, created } = require("../utils/http");
const {
  listUsers,
  getUserById,
  createUser,
  updateUser,
} = require("../services/users.service");

const parseId = (idValue, resource) => {
  const id = Number.parseInt(idValue, 10);
  if (Number.isNaN(id)) {
    throw new AppError(400, `${resource}_ID_INVALID`, `Id de ${resource} invalido`);
  }
  return id;
};

const listUsersController = async (req, res) => {
  const users = await listUsers(req.query.q);
  return ok(res, users, { total: users.length });
};

const getUserController = async (req, res) => {
  const id = parseId(req.params.id, "usuario");
  const user = await getUserById(id);
  return ok(res, user);
};

const createUserController = async (req, res) => {
  const user = await createUser(req.body || {});
  return created(res, user);
};

const updateUserController = async (req, res) => {
  const id = parseId(req.params.id, "usuario");
  const user = await updateUser(id, req.body || {});
  return ok(res, user);
};

module.exports = {
  listUsersController,
  getUserController,
  createUserController,
  updateUserController,
};
