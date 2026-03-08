const normalizePlate = (plate) => {
  return String(plate || "")
    .toUpperCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/-/g, "");
};

const isValidPlate = (plate) => {
  return /^[A-Z0-9]{5,7}$/.test(normalizePlate(plate));
};

module.exports = {
  normalizePlate,
  isValidPlate,
};
