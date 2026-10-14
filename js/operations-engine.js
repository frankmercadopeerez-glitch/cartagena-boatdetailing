(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.CBDOperationsEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const NON_PROJECT_NAMES = new Set([
    "",
    "sin proyecto",
    "operacion general",
    "operación general",
    "publicidad",
    "publicidad semanal",
    "marketing",
    "administracion",
    "administración",
  ]);

  const EXCLUDED_FINANCE_CATEGORIES = new Set([
    "aporte de capital",
    "retiro de capital",
    "retiro de profit",
    "devolucion de capital personal",
    "devolución de capital personal",
    "transferencia interna",
  ]);

  const normalize = (value) =>
    String(value || "")
      .trim()
      .replace(/\s+/g, " ")
      .toLocaleLowerCase("es");

  const slugify = (value) =>
    normalize(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "proyecto";

  function isRealProjectName(name) {
    const normalized = normalize(name);
    return normalized.length > 2 && !NON_PROJECT_NAMES.has(normalized);
  }

  function isClosed(name, projectStates) {
    const wanted = normalize(name);
    return Object.entries(projectStates || {}).some(
      ([storedName, closed]) => normalize(storedName) === wanted && closed === true,
    );
  }

  function isProjectCloseRecord(transaction) {
    if (!transaction) return false;
    if (transaction.motorType === "project_close") return true;
    const project = transaction.project || transaction.proyecto;
    const description = normalize(transaction.descripcion);
    return Boolean(
      project &&
        ((!transaction.tipo &&
          !transaction.categoria &&
          !transaction.monto &&
          !transaction.amount &&
          !transaction.reversalOf) ||
          description.includes("cierre de proyecto") ||
          description.includes("cierre de orchid")),
    );
  }

  function deriveFinanceProjects(transactions, projectStates) {
    const projects = new Map();
    const closedProjectNames = new Set(
      (transactions || [])
        .filter(isProjectCloseRecord)
        .map((transaction) => normalize(transaction.project || transaction.proyecto)),
    );
    (transactions || []).forEach((transaction) => {
      if (!transaction || transaction.archived === true) return;
      if (isProjectCloseRecord(transaction) || transaction.motorType === "project_reopen") return;
      const name = String(transaction.proyecto || transaction.project || "").trim();
      if (!isRealProjectName(name)) return;
      const key = normalize(name);
      const current = projects.get(key) || {
        id: slugify(name),
        name,
        income: 0,
        expenses: 0,
        lastMovement: "",
      };
      const amount = Number(transaction.monto || transaction.amount || 0);
      if (transaction.tipo === "ingreso") current.income += amount;
      if (transaction.tipo === "gasto") current.expenses += amount;
      const movementDate = String(transaction.fecha || "");
      if (movementDate > current.lastMovement) current.lastMovement = movementDate;
      projects.set(key, current);
    });
    return [...projects.values()]
      .map((project) => ({
        ...project,
        balance: project.income - project.expenses,
        financeClosed:
          isClosed(project.name, projectStates) || closedProjectNames.has(normalize(project.name)),
      }))
      .filter((project) => !project.financeClosed)
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }

  function daysUntil(dateString, now) {
    if (!dateString) return null;
    const target = new Date(`${dateString}T12:00:00`);
    if (Number.isNaN(target.getTime())) return null;
    const base =
      typeof now === "string" && /^\d{4}-\d{2}-\d{2}$/.test(now)
        ? new Date(`${now}T12:00:00`)
        : now
          ? new Date(now)
          : new Date();
    base.setHours(12, 0, 0, 0);
    return Math.ceil((target.getTime() - base.getTime()) / 86400000);
  }

  function taskProgress(tasks, fallback) {
    const list = Array.isArray(tasks) ? tasks : [];
    if (!list.length) return Math.max(0, Math.min(100, Number(fallback) || 0));
    const completed = list.filter((task) => task.done).length;
    return Math.round((completed / list.length) * 100);
  }

  function urgencyFor(project, now) {
    const deadlineDays = daysUntil(project.deadline, now);
    const overdueReminder = (project.reminders || []).some(
      (item) => !item.done && daysUntil(item.dueDate, now) < 0,
    );
    const overdueTask = (project.tasks || []).some(
      (item) => !item.done && daysUntil(item.dueDate, now) < 0,
    );
    if (deadlineDays !== null && deadlineDays < 0) return "late";
    if (overdueReminder || overdueTask) return "late";
    if (deadlineDays !== null && deadlineDays <= 3) return "attention";
    return "on-track";
  }

  function mergeProjects(financeProjects, operationDocuments) {
    const operationsByKey = new Map(
      (operationDocuments || []).map((document) => [normalize(document.financeProjectName || document.name), document]),
    );
    const merged = (financeProjects || []).map((finance) => ({
      name: finance.name,
      financeProjectName: finance.name,
      status: "in_process",
      scope: "",
      location: "",
      startDate: "",
      deadline: "",
      progress: 0,
      tasks: [],
      reminders: [],
      notes: "",
      ...operationsByKey.get(normalize(finance.name)),
      finance,
    }));
    const financeKeys = new Set((financeProjects || []).map((project) => normalize(project.name)));
    (operationDocuments || []).forEach((document) => {
      if (!financeKeys.has(normalize(document.financeProjectName || document.name))) {
        merged.push({ finance: null, tasks: [], reminders: [], ...document });
      }
    });
    return merged.filter((project) => project.status !== "completed");
  }

  function isFrankBusinessTransaction(transaction) {
    if (!transaction || transaction.archived === true) return false;
    if (!['ingreso', 'gasto'].includes(transaction.tipo)) return false;
    if (['project_close', 'project_reopen', 'capital_transfer'].includes(transaction.motorType)) return false;
    if (EXCLUDED_FINANCE_CATEGORIES.has(normalize(transaction.categoria))) return false;
    const owner = normalize(
      transaction.tipo === 'ingreso'
        ? transaction.receptor || transaction.responsible || transaction.persona
        : transaction.responsible || transaction.receptor || transaction.persona,
    );
    return owner === 'frank';
  }

  function snapshotTransaction(transaction) {
    const amount = Math.max(0, Number(transaction.monto != null ? transaction.monto : transaction.amount) || 0);
    const type = transaction.tipo === 'gasto' ? 'gasto' : 'ingreso';
    return {
      tipo: type,
      monto: amount,
      fecha: String(transaction.fecha || ''),
      hora: String(transaction.hora || ''),
      categoria: String(transaction.categoria || (type === 'ingreso' ? 'Otros Ingresos' : 'Otros Gastos')),
      descripcion: String(transaction.descripcion || ''),
      proyecto: String(transaction.proyecto || transaction.project || ''),
      medio: String(transaction.medio || ''),
      fundingSource: String(transaction.fundingSource || ''),
      imported: true,
      originalType: type,
      originalAmount: amount,
      owner: 'Frank',
    };
  }

  function signedAmount(type, amount) {
    const value = Math.max(0, Number(amount) || 0);
    return type === 'gasto' ? -value : value;
  }

  function financeTotals(transactions, openingBalance) {
    const active = (transactions || []).filter((transaction) => transaction && transaction.archived !== true);
    let income = 0;
    let expenses = 0;
    let adjustment = 0;
    active.forEach((transaction) => {
      const amount = Math.max(0, Number(transaction.monto) || 0);
      if (transaction.tipo === 'ingreso') income += amount;
      if (transaction.tipo === 'gasto') expenses += amount;
      if (transaction.imported) {
        adjustment +=
          signedAmount(transaction.tipo, amount) -
          signedAmount(transaction.originalType || transaction.tipo, transaction.originalAmount);
      } else {
        adjustment += signedAmount(transaction.tipo, amount);
      }
    });
    return {
      income,
      expenses,
      result: income - expenses,
      available: (Number(openingBalance) || 0) + adjustment,
      count: active.length,
      importedCount: active.filter((transaction) => transaction.imported).length,
    };
  }

  return {
    daysUntil,
    deriveFinanceProjects,
    isRealProjectName,
    isProjectCloseRecord,
    isFrankBusinessTransaction,
    snapshotTransaction,
    financeTotals,
    mergeProjects,
    normalize,
    slugify,
    taskProgress,
    urgencyFor,
  };
});
