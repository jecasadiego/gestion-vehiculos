const ok = (res, data, meta = null) => {
  const payload = { ok: true, data };
  if (meta) {
    payload.meta = meta;
  }
  return res.status(200).json(payload);
};

const created = (res, data) => {
  return res.status(201).json({ ok: true, data });
};

const asyncHandler = (handler) => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

module.exports = {
  ok,
  created,
  asyncHandler,
};
