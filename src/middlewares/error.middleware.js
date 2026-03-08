const {
  ValidationError,
  UniqueConstraintError,
  ForeignKeyConstraintError,
  DatabaseError,
} = require("sequelize");
const { AppError } = require("../utils/errors");

const formatValidationDetails = (error) => {
  return Array.isArray(error.errors)
    ? error.errors.map((issue) => ({
        path: issue.path,
        message: issue.message,
      }))
    : null;
};

const errorMiddleware = (error, req, res, next) => {
  const requestId = req.requestId || null;

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        requestId,
      },
    });
  }

  if (error instanceof UniqueConstraintError) {
    return res.status(409).json({
      ok: false,
      error: {
        code: "UNIQUE_CONSTRAINT_ERROR",
        message: "Existe un registro duplicado para un campo unico",
        details: formatValidationDetails(error),
        requestId,
      },
    });
  }

  if (error instanceof ValidationError) {
    return res.status(400).json({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Error de validacion en los datos enviados",
        details: formatValidationDetails(error),
        requestId,
      },
    });
  }

  if (error instanceof ForeignKeyConstraintError) {
    return res.status(400).json({
      ok: false,
      error: {
        code: "FOREIGN_KEY_CONSTRAINT_ERROR",
        message: "Se intento relacionar un registro inexistente",
        requestId,
      },
    });
  }

  if (error instanceof DatabaseError) {
    return res.status(400).json({
      ok: false,
      error: {
        code: "DATABASE_ERROR",
        message: "Error de base de datos al procesar la solicitud",
        requestId,
      },
    });
  }

  // eslint-disable-next-line no-console
  console.error(error);
  return res.status(500).json({
    ok: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Error interno del servidor",
      requestId,
    },
  });
};

module.exports = {
  errorMiddleware,
};
