const { User, Op } = require("../models");
const { AppError } = require("../utils/errors");

const mapUser = (row) => ({
  id: row.id,
  fullName: row.full_name,
  document: row.document,
  phone: row.phone,
  createdAt: row.created_at,
});

const listUsers = async (query) => {
  const search = String(query || "").trim();
  const where = search
    ? {
        [Op.or]: [
          { full_name: { [Op.like]: `%${search}%` } },
          { document: { [Op.like]: `%${search}%` } },
        ],
      }
    : {};

  const rows = await User.findAll({
    where,
    order: [["id", "DESC"]],
  });

  return rows.map((row) => mapUser(row.get({ plain: true })));
};

const getUserById = async (id) => {
  const user = await User.findByPk(id);
  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "Usuario no encontrado");
  }
  return mapUser(user.get({ plain: true }));
};

const validateRequiredUserData = (fullName, document) => {
  if (!fullName) {
    throw new AppError(400, "USER_NAME_REQUIRED", "El nombre es obligatorio");
  }
  if (!document) {
    throw new AppError(
      400,
      "USER_DOCUMENT_REQUIRED",
      "El documento es obligatorio"
    );
  }
};

const createUser = async ({ fullName, document, phone }) => {
  const cleanName = String(fullName || "").trim();
  const cleanDocument = String(document || "").trim();
  const cleanPhone = String(phone || "").trim() || null;

  validateRequiredUserData(cleanName, cleanDocument);

  const existing = await User.findOne({ where: { document: cleanDocument } });
  if (existing) {
    throw new AppError(
      409,
      "USER_DOCUMENT_DUPLICATED",
      "Ya existe un usuario con ese documento"
    );
  }

  const user = await User.create({
    full_name: cleanName,
    document: cleanDocument,
    phone: cleanPhone,
    created_at: new Date().toISOString(),
  });

  return mapUser(user.get({ plain: true }));
};

const updateUser = async (id, { fullName, document, phone }) => {
  const cleanName = String(fullName || "").trim();
  const cleanDocument = String(document || "").trim();
  const cleanPhone = String(phone || "").trim() || null;

  validateRequiredUserData(cleanName, cleanDocument);

  const user = await User.findByPk(id);
  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "Usuario no encontrado");
  }

  const duplicated = await User.findOne({
    where: {
      document: cleanDocument,
      id: { [Op.ne]: id },
    },
  });
  if (duplicated) {
    throw new AppError(
      409,
      "USER_DOCUMENT_DUPLICATED",
      "Ya existe otro usuario con ese documento"
    );
  }

  await user.update({
    full_name: cleanName,
    document: cleanDocument,
    phone: cleanPhone,
  });

  return mapUser(user.get({ plain: true }));
};

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
};
