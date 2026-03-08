(() => {
  const STORAGE_KEY = "autos-colombia-demo-db";
  const DEMO_FLAG = "demo";
  const DEMO_FLAG_VALUE = "1";
  const LATENCY_MS = 80;
  const MONTHLY_STATUSES = new Set(["Activa", "Inactiva", "Pendiente"]);

  const normalizePlate = (value) =>
    String(value || "")
      .toUpperCase()
      .trim()
      .replace(/\s+/g, "")
      .replace(/-/g, "");

  const isValidPlate = (plate) => /^[A-Z0-9]{5,7}$/.test(normalizePlate(plate));

  const clone = (value) => JSON.parse(JSON.stringify(value));

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const createError = (status, code, message) => {
    const error = new Error(message);
    error.status = status;
    error.code = code;
    return error;
  };

  const isGitHubPagesHost = () => /\.github\.io$/i.test(window.location.hostname);
  const isFilePreview = () => window.location.protocol === "file:";
  const isQueryDemoEnabled = () =>
    new URLSearchParams(window.location.search).get(DEMO_FLAG) === DEMO_FLAG_VALUE;

  const isDemoMode = isGitHubPagesHost() || isFilePreview() || isQueryDemoEnabled();

  const buildSeedState = () => {
    const now = Date.now();
    const occupiedEntry = new Date(now - 1000 * 60 * 90).toISOString();
    const closedEntry = new Date(now - 1000 * 60 * 60 * 28).toISOString();
    const closedExit = new Date(now - 1000 * 60 * 60 * 26).toISOString();
    const paymentAt = new Date(now - 1000 * 60 * 60 * 24).toISOString();
    const createdAt = new Date(now - 1000 * 60 * 60 * 72).toISOString();

    const users = [
      {
        id: 1,
        fullName: "Operario Demo",
        document: "100200300",
        phone: "3001234567",
        createdAt,
      },
    ];

    const vehicles = [
      {
        id: 1,
        plate: "ABC123",
        ownerName: "Carlos Ruiz",
        phone: "3101112233",
        isMonthly: true,
        monthlyStatus: "Activa",
        createdAt,
      },
      {
        id: 2,
        plate: "XYZ789",
        ownerName: "Laura Pena",
        phone: "3114445566",
        isMonthly: true,
        monthlyStatus: "Pendiente",
        createdAt,
      },
    ];

    const cells = Array.from({ length: 100 }, (_, index) => ({
      id: index + 1,
      code: `A${index + 1}`,
      status: "available",
      vehicleId: null,
      createdAt,
    }));

    cells[0].status = "occupied";
    cells[0].vehicleId = 1;

    const stays = [
      {
        id: 1,
        vehicleId: 1,
        cellId: 1,
        entryTime: occupiedEntry,
        exitTime: null,
        status: "active",
        note: "Vehiculo activo en modo demo",
      },
      {
        id: 2,
        vehicleId: 2,
        cellId: 2,
        entryTime: closedEntry,
        exitTime: closedExit,
        status: "closed",
        note: "Registro historico demo",
      },
    ];

    const payments = [
      {
        id: 1,
        vehicleId: 2,
        stayId: 2,
        amount: 120000,
        paymentMethod: "Transferencia",
        period: "2026-03",
        description: "Pago demo mensual",
        paidAt: paymentAt,
      },
    ];

    return {
      nextIds: {
        users: users.length + 1,
        vehicles: vehicles.length + 1,
        stays: stays.length + 1,
        incidents: 1,
        payments: payments.length + 1,
      },
      users,
      vehicles,
      cells,
      stays,
      incidents: [],
      payments,
    };
  };

  const loadState = () => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const seeded = buildSeedState();
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
        return seeded;
      }
      return JSON.parse(raw);
    } catch (error) {
      const seeded = buildSeedState();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
  };

  const saveState = (state) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  const getVehicleById = (state, vehicleId) =>
    state.vehicles.find((vehicle) => vehicle.id === vehicleId) || null;

  const getCellById = (state, cellId) =>
    state.cells.find((cell) => cell.id === cellId) || null;

  const getActiveStayByVehicleId = (state, vehicleId) =>
    state.stays.find((stay) => stay.vehicleId === vehicleId && stay.status === "active") || null;

  const mapVehicle = (vehicle) => ({
    id: vehicle.id,
    plate: vehicle.plate,
    ownerName: vehicle.ownerName,
    phone: vehicle.phone,
    isMonthly: Boolean(vehicle.isMonthly),
    monthlyStatus: vehicle.monthlyStatus,
    createdAt: vehicle.createdAt,
  });

  const mapUser = (user) => ({
    id: user.id,
    fullName: user.fullName,
    document: user.document,
    phone: user.phone,
    createdAt: user.createdAt,
  });

  const mapCell = (state, cell) => {
    const vehicle = cell.vehicleId ? getVehicleById(state, cell.vehicleId) : null;

    return {
      id: cell.id,
      code: cell.code,
      status: cell.status,
      vehicle: vehicle
        ? {
            id: vehicle.id,
            plate: vehicle.plate,
            ownerName: vehicle.ownerName,
          }
        : null,
    };
  };

  const mapStay = (state, stay) => {
    const vehicle = getVehicleById(state, stay.vehicleId);
    const cell = getCellById(state, stay.cellId);

    return {
      id: stay.id,
      entryTime: stay.entryTime,
      exitTime: stay.exitTime,
      status: stay.status,
      note: stay.note,
      vehicle: {
        id: vehicle.id,
        plate: vehicle.plate,
        ownerName: vehicle.ownerName,
        monthlyStatus: vehicle.monthlyStatus,
      },
      cell: {
        id: cell.id,
        code: cell.code,
      },
    };
  };

  const mapPayment = (state, payment) => {
    const vehicle = getVehicleById(state, payment.vehicleId);

    return {
      id: payment.id,
      amount: Number(payment.amount),
      paymentMethod: payment.paymentMethod,
      period: payment.period,
      description: payment.description,
      paidAt: payment.paidAt,
      stayId: payment.stayId,
      vehicle: {
        id: vehicle.id,
        plate: vehicle.plate,
        ownerName: vehicle.ownerName,
      },
    };
  };

  const mapIncident = (state, incident) => {
    const vehicle = getVehicleById(state, incident.vehicleId);

    return {
      id: incident.id,
      description: incident.description,
      createdAt: incident.createdAt,
      stayId: incident.stayId,
      vehicle: {
        id: vehicle.id,
        plate: vehicle.plate,
        ownerName: vehicle.ownerName,
      },
    };
  };

  const parseMonthlyStatus = (value) => {
    const status = String(value || "Activa").trim() || "Activa";

    if (!MONTHLY_STATUSES.has(status)) {
      throw createError(400, "VEHICLE_MONTHLY_STATUS_INVALID", "Estado mensual invalido");
    }

    return status;
  };

  const listCells = (state) => {
    const cells = state.cells.map((cell) => mapCell(state, cell));
    const occupied = cells.filter((cell) => cell.status === "occupied").length;

    return {
      summary: {
        total: cells.length,
        occupied,
        available: cells.length - occupied,
      },
      cells,
    };
  };

  const listVehicles = (state) =>
    state.vehicles
      .slice()
      .sort((first, second) => second.id - first.id)
      .map((vehicle) => mapVehicle(vehicle));

  const listUsers = (state) =>
    state.users
      .slice()
      .sort((first, second) => second.id - first.id)
      .map((user) => mapUser(user));

  const getVehicleByPlate = (state, plateInput) => {
    const plate = normalizePlate(plateInput);

    if (!isValidPlate(plate)) {
      throw createError(400, "VEHICLE_PLATE_INVALID", "Placa invalida");
    }

    const vehicle = state.vehicles.find((item) => item.plate === plate);

    if (!vehicle) {
      throw createError(404, "VEHICLE_NOT_FOUND", "Vehiculo no encontrado");
    }

    return mapVehicle(vehicle);
  };

  const createVehicle = (state, payload) => {
    const plate = normalizePlate(payload.plate);
    const ownerName = String(payload.ownerName || "").trim();
    const phone = String(payload.phone || "").trim() || null;
    const monthlyStatus = parseMonthlyStatus(payload.monthlyStatus);
    const isMonthly = typeof payload.isMonthly === "boolean" ? payload.isMonthly : true;

    if (!isValidPlate(plate)) {
      throw createError(400, "VEHICLE_PLATE_INVALID", "Placa invalida");
    }

    if (!ownerName) {
      throw createError(
        400,
        "VEHICLE_OWNER_NAME_REQUIRED",
        "El nombre del cliente es obligatorio"
      );
    }

    if (state.vehicles.some((vehicle) => vehicle.plate === plate)) {
      throw createError(409, "VEHICLE_PLATE_DUPLICATED", "Ya existe un vehiculo con esa placa");
    }

    const vehicle = {
      id: state.nextIds.vehicles,
      plate,
      ownerName,
      phone,
      isMonthly,
      monthlyStatus,
      createdAt: new Date().toISOString(),
    };

    state.nextIds.vehicles += 1;
    state.vehicles.unshift(vehicle);
    saveState(state);

    return mapVehicle(vehicle);
  };

  const createUser = (state, payload) => {
    const fullName = String(payload.fullName || "").trim();
    const document = String(payload.document || "").trim();
    const phone = String(payload.phone || "").trim() || null;

    if (!fullName) {
      throw createError(400, "USER_NAME_REQUIRED", "El nombre es obligatorio");
    }

    if (!document) {
      throw createError(400, "USER_DOCUMENT_REQUIRED", "El documento es obligatorio");
    }

    if (state.users.some((user) => user.document === document)) {
      throw createError(409, "USER_DOCUMENT_DUPLICATED", "Ya existe un usuario con ese documento");
    }

    const user = {
      id: state.nextIds.users,
      fullName,
      document,
      phone,
      createdAt: new Date().toISOString(),
    };

    state.nextIds.users += 1;
    state.users.unshift(user);
    saveState(state);

    return mapUser(user);
  };

  const registerEntry = (state, payload) => {
    const plate = normalizePlate(payload.plate);
    const cellCode = String(payload.cellCode || "").trim().toUpperCase();
    const ownerName = String(payload.ownerName || "").trim();
    const phone = String(payload.phone || "").trim() || null;
    const monthlyStatus = parseMonthlyStatus(payload.monthlyStatus);
    const isMonthly = typeof payload.isMonthly === "boolean" ? payload.isMonthly : true;
    const note = String(payload.note || "").trim() || null;

    if (!isValidPlate(plate)) {
      throw createError(400, "VEHICLE_PLATE_INVALID", "Placa invalida");
    }

    if (!cellCode) {
      throw createError(400, "CELL_CODE_REQUIRED", "Debe enviar cellCode");
    }

    const cell = state.cells.find((item) => item.code === cellCode);
    if (!cell) {
      throw createError(404, "CELL_NOT_FOUND", "La celda no existe");
    }

    if (cell.status !== "available") {
      throw createError(409, "CELL_OCCUPIED", "La celda ya esta ocupada");
    }

    let vehicle = state.vehicles.find((item) => item.plate === plate);

    if (!vehicle) {
      if (!ownerName) {
        throw createError(
          400,
          "OWNER_NAME_REQUIRED",
          "Debe enviar ownerName para registrar una placa nueva"
        );
      }

      vehicle = {
        id: state.nextIds.vehicles,
        plate,
        ownerName,
        phone,
        isMonthly,
        monthlyStatus,
        createdAt: new Date().toISOString(),
      };
      state.nextIds.vehicles += 1;
      state.vehicles.unshift(vehicle);
    }

    const activeStay = getActiveStayByVehicleId(state, vehicle.id);
    if (activeStay) {
      const activeCell = getCellById(state, activeStay.cellId);
      throw createError(
        409,
        "ACTIVE_STAY_ALREADY_EXISTS",
        `El vehiculo ya tiene una estancia activa en ${activeCell.code}`
      );
    }

    const stay = {
      id: state.nextIds.stays,
      vehicleId: vehicle.id,
      cellId: cell.id,
      entryTime: new Date().toISOString(),
      exitTime: null,
      status: "active",
      note,
    };

    state.nextIds.stays += 1;
    state.stays.push(stay);
    cell.status = "occupied";
    cell.vehicleId = vehicle.id;
    saveState(state);

    return mapStay(state, stay);
  };

  const getActiveStayByPlate = (state, plateInput) => {
    const plate = normalizePlate(plateInput);

    if (!isValidPlate(plate)) {
      throw createError(400, "VEHICLE_PLATE_INVALID", "Placa invalida");
    }

    const vehicle = state.vehicles.find((item) => item.plate === plate);
    if (!vehicle) {
      throw createError(404, "VEHICLE_NOT_FOUND", "Vehiculo no encontrado");
    }

    const stay = getActiveStayByVehicleId(state, vehicle.id);
    if (!stay) {
      throw createError(
        404,
        "ACTIVE_STAY_NOT_FOUND",
        "No hay una estancia activa para esta placa"
      );
    }

    return mapStay(state, stay);
  };

  const registerExit = (state, payload) => {
    const plate = normalizePlate(payload.plate);
    const paymentData =
      payload.payment && typeof payload.payment === "object" ? payload.payment : null;

    if (!isValidPlate(plate)) {
      throw createError(400, "VEHICLE_PLATE_INVALID", "Placa invalida");
    }

    const vehicle = state.vehicles.find((item) => item.plate === plate);
    if (!vehicle) {
      throw createError(404, "VEHICLE_NOT_FOUND", "Vehiculo no encontrado");
    }

    const stay = getActiveStayByVehicleId(state, vehicle.id);
    if (!stay) {
      throw createError(
        404,
        "ACTIVE_STAY_NOT_FOUND",
        "No hay estancia activa para esta placa"
      );
    }

    const cell = getCellById(state, stay.cellId);
    const now = new Date().toISOString();

    stay.status = "closed";
    stay.exitTime = now;
    cell.status = "available";
    cell.vehicleId = null;

    let payment = null;
    if (paymentData) {
      const amount = Number(paymentData.amount);
      const paymentMethod = String(paymentData.paymentMethod || "").trim();
      const period = String(paymentData.period || "").trim() || null;
      const description = String(paymentData.description || "").trim() || null;

      if (!Number.isFinite(amount) || amount <= 0) {
        throw createError(
          400,
          "PAYMENT_AMOUNT_INVALID",
          "El monto de pago debe ser mayor a 0"
        );
      }

      if (!paymentMethod) {
        throw createError(
          400,
          "PAYMENT_METHOD_REQUIRED",
          "paymentMethod es obligatorio para registrar pago"
        );
      }

      payment = {
        id: state.nextIds.payments,
        vehicleId: vehicle.id,
        stayId: stay.id,
        amount,
        paymentMethod,
        period,
        description,
        paidAt: now,
      };

      state.nextIds.payments += 1;
      state.payments.unshift(payment);
    }

    saveState(state);

    return {
      stay: mapStay(state, stay),
      payment: payment ? mapPayment(state, payment) : null,
    };
  };

  const createIncident = (state, payload) => {
    const plate = normalizePlate(payload.plate);
    const description = String(payload.description || "").trim();

    if (!isValidPlate(plate)) {
      throw createError(400, "VEHICLE_PLATE_INVALID", "Placa invalida");
    }

    if (!description) {
      throw createError(
        400,
        "INCIDENT_DESCRIPTION_REQUIRED",
        "La descripcion de la novedad es obligatoria"
      );
    }

    const vehicle = state.vehicles.find((item) => item.plate === plate);
    if (!vehicle) {
      throw createError(404, "VEHICLE_NOT_FOUND", "Vehiculo no encontrado");
    }

    const activeStay = getActiveStayByVehicleId(state, vehicle.id);
    const incident = {
      id: state.nextIds.incidents,
      vehicleId: vehicle.id,
      stayId: activeStay ? activeStay.id : null,
      description,
      createdAt: new Date().toISOString(),
    };

    state.nextIds.incidents += 1;
    state.incidents.unshift(incident);
    saveState(state);

    return mapIncident(state, incident);
  };

  const createPayment = (state, payload) => {
    const plate = normalizePlate(payload.plate);
    const amount = Number(payload.amount);
    const paymentMethod = String(payload.paymentMethod || "").trim();
    const period = String(payload.period || "").trim() || null;
    const description = String(payload.description || "").trim() || null;

    if (!isValidPlate(plate)) {
      throw createError(400, "VEHICLE_PLATE_INVALID", "Placa invalida");
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw createError(400, "PAYMENT_AMOUNT_INVALID", "El monto debe ser un numero mayor a 0");
    }

    if (!paymentMethod) {
      throw createError(400, "PAYMENT_METHOD_REQUIRED", "paymentMethod es obligatorio");
    }

    const vehicle = state.vehicles.find((item) => item.plate === plate);
    if (!vehicle) {
      throw createError(404, "VEHICLE_NOT_FOUND", "Vehiculo no encontrado");
    }

    const activeStay = getActiveStayByVehicleId(state, vehicle.id);
    const payment = {
      id: state.nextIds.payments,
      vehicleId: vehicle.id,
      stayId: activeStay ? activeStay.id : null,
      amount,
      paymentMethod,
      period,
      description,
      paidAt: new Date().toISOString(),
    };

    state.nextIds.payments += 1;
    state.payments.unshift(payment);
    saveState(state);

    return mapPayment(state, payment);
  };

  const parseBody = (options) => {
    if (!options || options.body == null) {
      return {};
    }

    if (typeof options.body === "string") {
      return JSON.parse(options.body);
    }

    if (typeof options.body === "object") {
      return clone(options.body);
    }

    return {};
  };

  const routeRequest = (state, path, options = {}) => {
    const method = String(options.method || "GET").toUpperCase();
    const payload = parseBody(options);

    if (method === "GET" && path === "/health") {
      return {
        service: "github-pages-demo",
        status: "ok",
      };
    }

    if (method === "GET" && path === "/cells") {
      return listCells(state);
    }

    if (method === "GET" && path === "/vehicles") {
      return listVehicles(state);
    }

    if (method === "GET" && path === "/users") {
      return listUsers(state);
    }

    if (method === "POST" && path === "/vehicles") {
      return createVehicle(state, payload);
    }

    if (method === "POST" && path === "/users") {
      return createUser(state, payload);
    }

    if (method === "POST" && path === "/stays/entry") {
      return registerEntry(state, payload);
    }

    if (method === "POST" && path === "/stays/exit") {
      return registerExit(state, payload);
    }

    if (method === "POST" && path === "/incidents") {
      return createIncident(state, payload);
    }

    if (method === "POST" && path === "/payments") {
      return createPayment(state, payload);
    }

    const vehicleByPlateMatch = path.match(/^\/vehicles\/plate\/([^/]+)$/);
    if (method === "GET" && vehicleByPlateMatch) {
      return getVehicleByPlate(state, decodeURIComponent(vehicleByPlateMatch[1]));
    }

    const activeStayMatch = path.match(/^\/stays\/active\/([^/]+)$/);
    if (method === "GET" && activeStayMatch) {
      return getActiveStayByPlate(state, decodeURIComponent(activeStayMatch[1]));
    }

    throw createError(404, "ENDPOINT_NOT_FOUND", "Endpoint no disponible en modo demo");
  };

  window.MockParkingApi = {
    isDemoMode,
    storageKey: STORAGE_KEY,
    reset() {
      const state = buildSeedState();
      saveState(state);
      return clone(state);
    },
    async request(path, options = {}) {
      await wait(LATENCY_MS);
      const state = loadState();
      const result = routeRequest(state, path, options);
      return clone(result);
    },
  };
})();
