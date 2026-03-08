const API_BASE = "/api/v1";
const apiAdapter = window.MockParkingApi || { isDemoMode: false };
const IS_DEMO_MODE = Boolean(apiAdapter.isDemoMode);
const API_READY_TEXT = IS_DEMO_MODE ? "Demo GitHub" : "Conectado";

const state = {
  cells: [],
  previousCellStatuses: {},
  selectedCellCode: null,
  validatedVehicle: null,
  validatedPlate: null,
  selectedActiveStay: null,
  vehicles: [],
  users: [],
  activeMainTab: "operation",
  activeAdminTab: "vehicles",
  api: {
    pending: 0,
    lastError: false,
    errorTimer: null,
  },
};

const el = {
  totalCells: document.querySelector("#totalCells"),
  occupiedCells: document.querySelector("#occupiedCells"),
  availableCellsCount: document.querySelector("#availableCellsCount"),
  parkingGrid: document.querySelector("#parkingGrid"),
  openEntryBtn: document.querySelector("#openEntryBtn"),
  openExitBtn: document.querySelector("#openExitBtn"),
  entryPlate: document.querySelector("#entryPlate"),
  entryOwnerName: document.querySelector("#entryOwnerName"),
  monthlyStatus: document.querySelector("#monthlyStatus"),
  validatePlateBtn: document.querySelector("#validatePlateBtn"),
  registerEntryBtn: document.querySelector("#registerEntryBtn"),
  plateCheck: document.querySelector("#plateCheck"),
  entrySelectedCell: document.querySelector("#entrySelectedCell"),
  entryModalGrid: document.querySelector("#entryModalGrid"),
  entryModalTotal: document.querySelector("#entryModalTotal"),
  entryModalOccupied: document.querySelector("#entryModalOccupied"),
  entryModalAvailable: document.querySelector("#entryModalAvailable"),
  exitPlate: document.querySelector("#exitPlate"),
  searchActiveBtn: document.querySelector("#searchActiveBtn"),
  registerExitBtn: document.querySelector("#registerExitBtn"),
  detailPlate: document.querySelector("#detailPlate"),
  detailCell: document.querySelector("#detailCell"),
  detailEntry: document.querySelector("#detailEntry"),
  exitAmount: document.querySelector("#exitAmount"),
  exitMethod: document.querySelector("#exitMethod"),
  exitModalGrid: document.querySelector("#exitModalGrid"),
  exitModalTotal: document.querySelector("#exitModalTotal"),
  exitModalOccupied: document.querySelector("#exitModalOccupied"),
  exitModalAvailable: document.querySelector("#exitModalAvailable"),
  incidentPlate: document.querySelector("#incidentPlate"),
  incidentDescription: document.querySelector("#incidentDescription"),
  registerIncidentBtn: document.querySelector("#registerIncidentBtn"),
  paymentPlate: document.querySelector("#paymentPlate"),
  paymentAmount: document.querySelector("#paymentAmount"),
  paymentMethod: document.querySelector("#paymentMethod"),
  paymentPeriod: document.querySelector("#paymentPeriod"),
  registerPaymentBtn: document.querySelector("#registerPaymentBtn"),
  eventLog: document.querySelector("#eventLog"),
  apiStatusBadge: document.querySelector("#apiStatusBadge"),
  apiStatusText: document.querySelector("#apiStatusText"),
  toastStack: document.querySelector("#toastStack"),
  vehiclePlate: document.querySelector("#vehiclePlate"),
  vehicleOwnerName: document.querySelector("#vehicleOwnerName"),
  vehiclePhone: document.querySelector("#vehiclePhone"),
  vehicleMonthlyStatus: document.querySelector("#vehicleMonthlyStatus"),
  vehicleIsMonthly: document.querySelector("#vehicleIsMonthly"),
  createVehicleBtn: document.querySelector("#createVehicleBtn"),
  vehiclesList: document.querySelector("#vehiclesList"),
  userFullName: document.querySelector("#userFullName"),
  userDocument: document.querySelector("#userDocument"),
  userPhone: document.querySelector("#userPhone"),
  createUserBtn: document.querySelector("#createUserBtn"),
  usersList: document.querySelector("#usersList"),
  mainTabButtons: Array.from(document.querySelectorAll("[data-main-tab]")),
  mainPanels: Array.from(document.querySelectorAll("[data-tab-panel]")),
  adminTabButtons: Array.from(document.querySelectorAll("[data-admin-tab]")),
  adminPanels: Array.from(document.querySelectorAll("[data-admin-panel]")),
  entryModal: document.querySelector("#entryModal"),
  exitModal: document.querySelector("#exitModal"),
  modalCloseButtons: Array.from(document.querySelectorAll("[data-modal-close]")),
};

const normalizePlate = (value) =>
  String(value || "")
    .toUpperCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/-/g, "");

const formatDate = (iso) => {
  if (!iso) {
    return "-";
  }
  const date = new Date(iso);
  return date.toLocaleString("es-CO", {
    hour12: true,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const setApiStatus = (mode, text) => {
  el.apiStatusBadge.classList.remove(
    "topbar__status--ok",
    "topbar__status--sync",
    "topbar__status--error"
  );
  if (mode === "sync") {
    el.apiStatusBadge.classList.add("topbar__status--sync");
  } else if (mode === "error") {
    el.apiStatusBadge.classList.add("topbar__status--error");
  } else {
    el.apiStatusBadge.classList.add("topbar__status--ok");
  }
  el.apiStatusText.textContent = text;
};

const beginApiCall = () => {
  state.api.pending += 1;
  setApiStatus("sync", "Sincronizando");
};

const endApiCall = () => {
  state.api.pending = Math.max(0, state.api.pending - 1);
  if (state.api.pending === 0 && !state.api.lastError) {
    setApiStatus("ok", API_READY_TEXT);
  }
};

const markApiError = () => {
  state.api.lastError = true;
  setApiStatus("error", "Error API");
  clearTimeout(state.api.errorTimer);
  state.api.errorTimer = setTimeout(() => {
    state.api.lastError = false;
    if (state.api.pending > 0) {
      setApiStatus("sync", "Sincronizando");
    } else {
      setApiStatus("ok", API_READY_TEXT);
    }
  }, 3000);
};

const logEvent = (text) => {
  const now = new Date().toLocaleTimeString("es-CO");
  el.eventLog.textContent = `[${now}] ${text}\n${el.eventLog.textContent}`.trim();
};

const pushToast = (type, text) => {
  const node = document.createElement("div");
  node.className = `toast toast--${type}`;
  node.textContent = text;
  el.toastStack.appendChild(node);

  setTimeout(() => {
    node.classList.add("toast--hide");
    setTimeout(() => node.remove(), 230);
  }, 2400);
};

const notifySuccess = (text) => {
  logEvent(text);
  pushToast("success", text);
};

const notifyInfo = (text) => {
  logEvent(text);
  pushToast("info", text);
};

const notifyError = (text) => {
  logEvent(text);
  pushToast("error", text);
};

const request = async (path, options = {}) => {
  beginApiCall();
  try {
    if (IS_DEMO_MODE) {
      return await apiAdapter.request(path, options);
    }

    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });

    const payload = await response
      .json()
      .catch(() => ({ ok: false, error: { message: "Respuesta no valida" } }));

    if (!response.ok || payload.ok === false) {
      const error = new Error(payload.error?.message || "Error de solicitud");
      error.status = response.status;
      error.code = payload.error?.code || null;
      throw error;
    }

    return payload.data;
  } catch (error) {
    markApiError();
    throw error;
  } finally {
    endApiCall();
  }
};

const runWithButtonLoading = async (button, loadingText, callback) => {
  const originalText = button.textContent.trim();
  button.disabled = true;
  button.classList.add("btn--loading");
  button.textContent = loadingText;
  try {
    return await callback();
  } finally {
    button.disabled = false;
    button.classList.remove("btn--loading");
    button.textContent = originalText;
  }
};

const activateMainTab = (tabName) => {
  state.activeMainTab = tabName;
  el.mainTabButtons.forEach((button) => {
    const isActive = button.dataset.mainTab === tabName;
    button.classList.toggle("menu__item--active", isActive);
    button.classList.toggle("main-tab-btn--active", isActive);
  });
  el.mainPanels.forEach((panel) => {
    panel.classList.toggle("tab-panel--active", panel.dataset.tabPanel === tabName);
  });
};

const activateAdminTab = (tabName) => {
  state.activeAdminTab = tabName;
  el.adminTabButtons.forEach((button) => {
    button.classList.toggle(
      "admin-nav__btn--active",
      button.dataset.adminTab === tabName
    );
  });
  el.adminPanels.forEach((panel) => {
    panel.classList.toggle(
      "admin-panel--active",
      panel.dataset.adminPanel === tabName
    );
  });
};

const closeModal = (modal) => {
  modal.classList.remove("modal--open");
  if (
    !el.entryModal.classList.contains("modal--open") &&
    !el.exitModal.classList.contains("modal--open")
  ) {
    document.body.classList.remove("modal-open");
  }
};

const openModal = (name) => {
  if (name === "entry") {
    el.entryModal.classList.add("modal--open");
    document.body.classList.add("modal-open");
    el.entryPlate.focus();
    return;
  }
  if (name === "exit") {
    el.exitModal.classList.add("modal--open");
    document.body.classList.add("modal-open");
    el.exitPlate.focus();
  }
};

const setMonthlyBadge = (text, mode = "neutral") => {
  el.monthlyStatus.textContent = text;
  el.monthlyStatus.classList.remove("badge--active", "badge--inactive");
  if (mode === "active") {
    el.monthlyStatus.classList.add("badge--active");
  }
  if (mode === "inactive") {
    el.monthlyStatus.classList.add("badge--inactive");
  }
};

const setPlateCheck = (mode, text) => {
  el.plateCheck.classList.remove("check-badge--ok", "check-badge--warn");
  if (mode === "ok") {
    el.plateCheck.classList.add("check-badge--ok");
  } else if (mode === "warn") {
    el.plateCheck.classList.add("check-badge--warn");
  }
  el.plateCheck.textContent = text;
};

const resetEntryValidation = () => {
  state.validatedVehicle = null;
  state.validatedPlate = null;
  el.entryOwnerName.value = "";
  el.entryOwnerName.disabled = true;
  setMonthlyBadge("Sin validar");
  setPlateCheck("neutral", "-");
};

const renderEntrySelectedCell = () => {
  el.entrySelectedCell.textContent = state.selectedCellCode || "Ninguna";
};

const getCellSummary = () => {
  const occupied = state.cells.filter((cell) => cell.status === "occupied").length;
  return {
    total: state.cells.length,
    occupied,
    available: state.cells.length - occupied,
  };
};

const renderStats = (summary) => {
  el.totalCells.textContent = summary.total;
  el.occupiedCells.textContent = summary.occupied;
  el.availableCellsCount.textContent = summary.available;

  el.entryModalTotal.textContent = summary.total;
  el.entryModalOccupied.textContent = summary.occupied;
  el.entryModalAvailable.textContent = summary.available;
  el.exitModalTotal.textContent = summary.total;
  el.exitModalOccupied.textContent = summary.occupied;
  el.exitModalAvailable.textContent = summary.available;
};

const renderParkingGrid = () => {
  el.parkingGrid.innerHTML = "";
  state.cells.forEach((cell) => {
    const previousStatus = state.previousCellStatuses[cell.code];
    const cellElement = document.createElement("div");
    cellElement.className = `cell ${
      cell.status === "occupied" ? "cell--occupied" : "cell--available"
    }`;
    if (previousStatus && previousStatus !== cell.status) {
      cellElement.classList.add(
        cell.status === "occupied" ? "cell--flash-occupied" : "cell--flash-available"
      );
    }
    state.previousCellStatuses[cell.code] = cell.status;
    cellElement.title =
      cell.status === "occupied" && cell.vehicle
        ? `${cell.code} - ${cell.vehicle.plate}`
        : `${cell.code} - Libre`;
    cellElement.textContent = cell.code;
    el.parkingGrid.appendChild(cellElement);
  });
};

const renderEntryModalGrid = () => {
  el.entryModalGrid.innerHTML = "";
  state.cells.forEach((cell) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = `modal-cell ${
      cell.status === "occupied" ? "modal-cell--occupied" : "modal-cell--available"
    }`;
    item.textContent = cell.code;
    item.title =
      cell.status === "occupied" && cell.vehicle
        ? `${cell.code} ocupada por ${cell.vehicle.plate}`
        : `${cell.code} disponible`;

    if (cell.status === "occupied") {
      item.disabled = true;
    } else {
      item.addEventListener("click", () => {
        state.selectedCellCode = cell.code;
        renderEntrySelectedCell();
        renderEntryModalGrid();
      });
    }

    if (state.selectedCellCode === cell.code) {
      item.classList.add("modal-cell--selected");
    }

    el.entryModalGrid.appendChild(item);
  });
};

const renderExitModalGrid = () => {
  el.exitModalGrid.innerHTML = "";
  const activeCode = state.selectedActiveStay ? state.selectedActiveStay.cell.code : null;
  state.cells.forEach((cell) => {
    const item = document.createElement("div");
    item.className = `modal-cell ${
      cell.status === "occupied" ? "modal-cell--occupied" : "modal-cell--available"
    }`;
    item.textContent = cell.code;
    item.title =
      cell.status === "occupied" && cell.vehicle
        ? `${cell.code} ocupada por ${cell.vehicle.plate}`
        : `${cell.code} disponible`;

    if (activeCode && activeCode === cell.code) {
      item.classList.add("modal-cell--focus");
    }

    el.exitModalGrid.appendChild(item);
  });
};

const renderActiveStayDetails = (stay) => {
  if (!stay) {
    el.detailPlate.textContent = "-";
    el.detailCell.textContent = "-";
    el.detailEntry.textContent = "-";
    renderExitModalGrid();
    return;
  }
  el.detailPlate.textContent = stay.vehicle.plate;
  el.detailCell.textContent = stay.cell.code;
  el.detailEntry.textContent = formatDate(stay.entryTime);
  renderExitModalGrid();
};

const renderVehiclesList = () => {
  el.vehiclesList.innerHTML = "";
  if (state.vehicles.length === 0) {
    const empty = document.createElement("li");
    empty.className = "record-item";
    empty.textContent = "Sin vehiculos registrados";
    el.vehiclesList.appendChild(empty);
    return;
  }

  state.vehicles.forEach((vehicle) => {
    const item = document.createElement("li");
    item.className = "record-item";

    const main = document.createElement("div");
    main.className = "record-main";
    const title = document.createElement("strong");
    title.textContent = vehicle.plate;
    const meta = document.createElement("span");
    meta.className = "record-meta";
    meta.textContent = `${vehicle.ownerName} | ${vehicle.monthlyStatus}`;
    main.append(title, meta);

    const actions = document.createElement("div");
    actions.className = "record-actions";

    const entryBtn = document.createElement("button");
    entryBtn.type = "button";
    entryBtn.className = "chip-btn";
    entryBtn.dataset.action = "entry";
    entryBtn.dataset.plate = vehicle.plate;
    entryBtn.textContent = "Entrada";

    const exitBtn = document.createElement("button");
    exitBtn.type = "button";
    exitBtn.className = "chip-btn";
    exitBtn.dataset.action = "exit";
    exitBtn.dataset.plate = vehicle.plate;
    exitBtn.textContent = "Salida";

    actions.append(entryBtn, exitBtn);
    item.append(main, actions);
    el.vehiclesList.appendChild(item);
  });
};

const renderUsersList = () => {
  el.usersList.innerHTML = "";
  if (state.users.length === 0) {
    const empty = document.createElement("li");
    empty.className = "record-item";
    empty.textContent = "Sin usuarios registrados";
    el.usersList.appendChild(empty);
    return;
  }

  state.users.forEach((user) => {
    const item = document.createElement("li");
    item.className = "record-item";

    const main = document.createElement("div");
    main.className = "record-main";
    const title = document.createElement("strong");
    title.textContent = user.fullName;
    const meta = document.createElement("span");
    meta.className = "record-meta";
    meta.textContent = `Documento ${user.document} | ${user.phone || "Sin telefono"}`;
    main.append(title, meta);
    item.append(main);
    el.usersList.appendChild(item);
  });
};

const loadDashboard = async () => {
  const data = await request("/cells");
  state.cells = data.cells;

  if (
    state.selectedCellCode &&
    !state.cells.some(
      (cell) => cell.code === state.selectedCellCode && cell.status === "available"
    )
  ) {
    state.selectedCellCode = null;
  }

  const summary = getCellSummary();
  renderStats(summary);
  renderParkingGrid();
  renderEntrySelectedCell();
  renderEntryModalGrid();
  renderExitModalGrid();
};

const loadManagementData = async () => {
  const [vehicles, users] = await Promise.all([request("/vehicles"), request("/users")]);
  state.vehicles = Array.isArray(vehicles) ? vehicles.slice(0, 10) : [];
  state.users = Array.isArray(users) ? users.slice(0, 10) : [];
  renderVehiclesList();
  renderUsersList();
};

const refreshCoreData = async () => {
  await Promise.all([loadDashboard(), loadManagementData()]);
};

const validatePlate = async () => {
  const plate = normalizePlate(el.entryPlate.value);
  if (!plate) {
    setPlateCheck("warn", "ERR");
    notifyError("La placa no puede estar vacia.");
    return;
  }

  try {
    const vehicle = await request(`/vehicles/plate/${plate}`);
    state.validatedVehicle = vehicle;
    state.validatedPlate = plate;
    el.entryOwnerName.value = vehicle.ownerName;
    el.entryOwnerName.disabled = true;
    setPlateCheck("ok", "OK");
    setMonthlyBadge(
      vehicle.monthlyStatus,
      vehicle.monthlyStatus === "Activa" ? "active" : "inactive"
    );
    notifySuccess(`Placa ${plate} validada para ${vehicle.ownerName}.`);
  } catch (error) {
    if (error.status === 404) {
      state.validatedVehicle = null;
      state.validatedPlate = plate;
      el.entryOwnerName.value = "";
      el.entryOwnerName.disabled = false;
      setPlateCheck("warn", "NEW");
      setMonthlyBadge("Sin registro", "inactive");
      notifyInfo(`Placa ${plate} no existe. Ingrese nombre para registrarla.`);
      return;
    }
    notifyError(error.message);
  }
};

const registerEntry = async () => {
  const plate = normalizePlate(el.entryPlate.value);
  const ownerName = el.entryOwnerName.value.trim();

  if (!plate) {
    notifyError("Debe ingresar una placa para registrar entrada.");
    return;
  }
  if (!state.selectedCellCode) {
    notifyError("Debe seleccionar una celda disponible en el mapa.");
    return;
  }
  if (!state.validatedVehicle && !ownerName) {
    notifyError("Debe ingresar el nombre del cliente para placa nueva.");
    return;
  }

  const payload = {
    plate,
    cellCode: state.selectedCellCode,
    monthlyStatus: state.validatedVehicle
      ? state.validatedVehicle.monthlyStatus
      : "Pendiente",
    isMonthly: true,
  };
  if (!state.validatedVehicle) {
    payload.ownerName = ownerName;
  }

  try {
    const stay = await request("/stays/entry", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    notifySuccess(
      `Entrada registrada: ${stay.vehicle.plate} -> ${stay.cell.code} (${formatDate(
        stay.entryTime
      )})`
    );

    state.selectedCellCode = null;
    state.validatedVehicle = null;
    state.validatedPlate = null;
    el.entryPlate.value = "";
    el.entryOwnerName.value = "";
    el.entryOwnerName.disabled = true;
    setMonthlyBadge("Sin validar");
    setPlateCheck("neutral", "-");
    closeModal(el.entryModal);
    await refreshCoreData();
  } catch (error) {
    notifyError(error.message);
  }
};

const searchActiveStay = async () => {
  const plate = normalizePlate(el.exitPlate.value);
  if (!plate) {
    notifyError("Debe ingresar placa para buscar salida.");
    return;
  }

  try {
    const stay = await request(`/stays/active/${plate}`);
    state.selectedActiveStay = stay;
    renderActiveStayDetails(stay);
    notifySuccess(`Registro activo encontrado para ${plate} en celda ${stay.cell.code}.`);
  } catch (error) {
    state.selectedActiveStay = null;
    renderActiveStayDetails(null);
    notifyError(error.message);
  }
};

const registerExit = async () => {
  const plate = normalizePlate(el.exitPlate.value);
  if (!plate) {
    notifyError("Debe ingresar placa para registrar salida.");
    return;
  }

  const amount = Number(el.exitAmount.value || "0");
  const payment =
    amount > 0
      ? {
          amount,
          paymentMethod: el.exitMethod.value,
          description: "Pago asociado al registro de salida",
        }
      : null;

  const payload = {
    plate,
    ...(payment ? { payment } : {}),
  };

  try {
    const result = await request("/stays/exit", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    notifySuccess(
      `Salida registrada: ${result.stay.vehicle.plate} libero ${result.stay.cell.code}.`
    );

    state.selectedActiveStay = null;
    renderActiveStayDetails(null);
    el.exitAmount.value = "";
    closeModal(el.exitModal);
    await refreshCoreData();
  } catch (error) {
    notifyError(error.message);
  }
};

const registerIncident = async () => {
  const plate = normalizePlate(el.incidentPlate.value);
  const description = el.incidentDescription.value.trim();

  if (!plate || !description) {
    notifyError("Debe ingresar placa y descripcion para la novedad.");
    return;
  }

  try {
    await request("/incidents", {
      method: "POST",
      body: JSON.stringify({ plate, description }),
    });
    notifySuccess(`Novedad registrada para ${plate}.`);
    el.incidentDescription.value = "";
  } catch (error) {
    notifyError(error.message);
  }
};

const registerPayment = async () => {
  const plate = normalizePlate(el.paymentPlate.value);
  const amount = Number(el.paymentAmount.value || "0");
  const paymentMethod = el.paymentMethod.value;
  const period = el.paymentPeriod.value.trim();

  if (!plate || amount <= 0) {
    notifyError("Debe ingresar placa y valor valido para registrar pago.");
    return;
  }

  try {
    await request("/payments", {
      method: "POST",
      body: JSON.stringify({
        plate,
        amount,
        paymentMethod,
        period,
      }),
    });
    notifySuccess(`Pago registrado para ${plate} por ${amount}.`);
    el.paymentAmount.value = "";
  } catch (error) {
    notifyError(error.message);
  }
};

const createVehicle = async () => {
  const plate = normalizePlate(el.vehiclePlate.value);
  const ownerName = el.vehicleOwnerName.value.trim();
  const phone = el.vehiclePhone.value.trim();

  if (!plate || !ownerName) {
    notifyError("Debe ingresar placa y nombre del cliente para crear vehiculo.");
    return;
  }

  try {
    const vehicle = await request("/vehicles", {
      method: "POST",
      body: JSON.stringify({
        plate,
        ownerName,
        phone,
        monthlyStatus: el.vehicleMonthlyStatus.value,
        isMonthly: Boolean(el.vehicleIsMonthly.checked),
      }),
    });

    notifySuccess(`Vehiculo ${vehicle.plate} creado correctamente.`);

    el.vehiclePlate.value = "";
    el.vehicleOwnerName.value = "";
    el.vehiclePhone.value = "";
    el.vehicleMonthlyStatus.value = "Activa";
    el.vehicleIsMonthly.checked = true;

    await refreshCoreData();
  } catch (error) {
    notifyError(error.message);
  }
};

const createUser = async () => {
  const fullName = el.userFullName.value.trim();
  const documentValue = el.userDocument.value.trim();
  const phone = el.userPhone.value.trim();

  if (!fullName || !documentValue) {
    notifyError("Debe ingresar nombre y documento para crear usuario.");
    return;
  }

  try {
    const user = await request("/users", {
      method: "POST",
      body: JSON.stringify({
        fullName,
        document: documentValue,
        phone,
      }),
    });

    notifySuccess(`Usuario ${user.fullName} creado correctamente.`);

    el.userFullName.value = "";
    el.userDocument.value = "";
    el.userPhone.value = "";
    await loadManagementData();
  } catch (error) {
    notifyError(error.message);
  }
};

const handleVehicleQuickAction = (event) => {
  const button = event.target.closest(".chip-btn");
  if (!button) {
    return;
  }

  const plate = button.dataset.plate || "";
  if (!plate) {
    return;
  }

  activateMainTab("operation");

  if (button.dataset.action === "entry") {
    el.entryPlate.value = plate;
    resetEntryValidation();
    openModal("entry");
    notifyInfo(`Placa ${plate} enviada al modal de entrada.`);
  } else if (button.dataset.action === "exit") {
    el.exitPlate.value = plate;
    openModal("exit");
    notifyInfo(`Placa ${plate} enviada al modal de salida.`);
  }
};

const bindEvents = () => {
  el.mainTabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activateMainTab(button.dataset.mainTab);
    });
  });

  el.adminTabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activateAdminTab(button.dataset.adminTab);
    });
  });

  el.openEntryBtn.addEventListener("click", () => {
    activateMainTab("operation");
    openModal("entry");
  });

  el.openExitBtn.addEventListener("click", () => {
    activateMainTab("operation");
    openModal("exit");
  });

  el.modalCloseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const name = button.dataset.modalClose;
      if (name === "entry") {
        closeModal(el.entryModal);
      } else if (name === "exit") {
        closeModal(el.exitModal);
      }
    });
  });

  [el.entryModal, el.exitModal].forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeModal(modal);
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }
    if (el.entryModal.classList.contains("modal--open")) {
      closeModal(el.entryModal);
    } else if (el.exitModal.classList.contains("modal--open")) {
      closeModal(el.exitModal);
    }
  });

  el.entryPlate.addEventListener("input", () => {
    const currentPlate = normalizePlate(el.entryPlate.value);
    if (!currentPlate || currentPlate !== state.validatedPlate) {
      state.validatedVehicle = null;
      state.validatedPlate = null;
      el.entryOwnerName.value = "";
      el.entryOwnerName.disabled = true;
      setMonthlyBadge("Sin validar");
      setPlateCheck("neutral", "-");
    }
  });

  el.validatePlateBtn.addEventListener("click", () =>
    runWithButtonLoading(el.validatePlateBtn, "Validando...", validatePlate)
  );
  el.registerEntryBtn.addEventListener("click", () =>
    runWithButtonLoading(el.registerEntryBtn, "Registrando...", registerEntry)
  );
  el.searchActiveBtn.addEventListener("click", () =>
    runWithButtonLoading(el.searchActiveBtn, "Buscando...", searchActiveStay)
  );
  el.registerExitBtn.addEventListener("click", () =>
    runWithButtonLoading(el.registerExitBtn, "Procesando...", registerExit)
  );
  el.registerIncidentBtn.addEventListener("click", () =>
    runWithButtonLoading(el.registerIncidentBtn, "Guardando...", registerIncident)
  );
  el.registerPaymentBtn.addEventListener("click", () =>
    runWithButtonLoading(el.registerPaymentBtn, "Guardando...", registerPayment)
  );
  el.createVehicleBtn.addEventListener("click", () =>
    runWithButtonLoading(el.createVehicleBtn, "Creando...", createVehicle)
  );
  el.createUserBtn.addEventListener("click", () =>
    runWithButtonLoading(el.createUserBtn, "Creando...", createUser)
  );
  el.vehiclesList.addEventListener("click", handleVehicleQuickAction);
};

const bootstrap = async () => {
  bindEvents();
  activateMainTab(state.activeMainTab);
  activateAdminTab(state.activeAdminTab);
  setApiStatus("ok", API_READY_TEXT);
  await refreshCoreData();
  notifyInfo(
    IS_DEMO_MODE
      ? "Modo demo GitHub Pages activo. Los datos viven en este navegador."
      : "Interfaz con iconos y modales de operacion habilitada."
  );
};

bootstrap().catch((error) => {
  notifyError(`Error al inicializar: ${error.message}`);
});
