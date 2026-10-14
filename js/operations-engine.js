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
    "marketing",
    "administracion",
    "administración",
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

  function deriveFinanceProjects(transactions, projectStates) {
    const projects = new Map();
    (transactions || []).forEach((transaction) => {
      if (!transaction || transaction.archived === true) return;
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
        financeClosed: isClosed(project.name, projectStates),
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

  return {
    daysUntil,
    deriveFinanceProjects,
    isRealProjectName,
    mergeProjects,
    normalize,
    slugify,
    taskProgress,
    urgencyFor,
  };
});
