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
    return merged.filter((project) => project.archived !== true);
  }

  function isBusinessTransaction(transaction) {
    if (!transaction || transaction.archived === true) return false;
    if (!['ingreso', 'gasto'].includes(transaction.tipo)) return false;
    if (['project_close', 'project_reopen', 'capital_transfer'].includes(transaction.motorType)) return false;
    if (EXCLUDED_FINANCE_CATEGORIES.has(normalize(transaction.categoria))) return false;
    return true;
  }

  function isFrankBusinessTransaction(transaction) {
    if (!isBusinessTransaction(transaction)) return false;
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
      originalCategory: String(transaction.categoria || (type === 'ingreso' ? 'Otros Ingresos' : 'Otros Gastos')),
      owner: String(transaction.receptor || transaction.responsible || transaction.persona || 'Empresa'),
    };
  }

  function signedAmount(type, amount) {
    const value = Math.max(0, Number(amount) || 0);
    return type === 'gasto' ? -value : value;
  }

  function isProfitWithdrawal(transaction) {
    return Boolean(transaction) && normalize(transaction.categoria) === 'retiro de profit';
  }

  function projectFinancials(project, transactions) {
    const wanted = normalize(project && (project.financeProjectName || project.name));
    const rows = (transactions || []).filter(
      (transaction) => transaction && transaction.archived !== true && normalize(transaction.proyecto || transaction.project) === wanted,
    );
    const ledgerPaid = rows
      .filter((transaction) => transaction.tipo === 'ingreso')
      .reduce((sum, transaction) => sum + Math.max(0, Number(transaction.monto) || 0), 0);
    const expenses = rows
      .filter((transaction) => transaction.tipo === 'gasto' && !isProfitWithdrawal(transaction))
      .reduce((sum, transaction) => sum + Math.max(0, Number(transaction.monto) || 0), 0);
    const releasedProfit = rows.reduce(
      (sum, transaction) => sum + Math.max(0, Number(transaction.releasedProjectProfit) || 0),
      0,
    );
    const openingPaid = Math.max(0, Number(project && project.paidOpening) || 0);
    const openingLedger = Math.max(0, Number(project && project.paidOpeningLedger) || 0);
    const paid = openingPaid > 0 ? openingPaid + Math.max(0, ledgerPaid - openingLedger) : ledgerPaid;
    const contractValue = Math.max(0, Number(project && project.contractValue) || 0);
    const pending = contractValue > 0 ? Math.max(0, contractValue - paid) : null;
    const nextPaymentAmount = Math.max(0, Number(project && project.nextPaymentAmount) || 0);
    const balance = paid - expenses - releasedProfit;
    return {
      contractValue,
      nextPaymentAmount,
      ledgerPaid,
      paid,
      pending,
      expenses,
      releasedProfit,
      balance,
      frankPotential: Math.max(0, balance) / 2,
    };
  }

  function financeTotals(transactions, financeMeta) {
    const active = (transactions || []).filter((transaction) => transaction && transaction.archived !== true);
    const meta = financeMeta && typeof financeMeta === 'object' ? financeMeta : { openingBalance: financeMeta };
    const hasSourceTotals = Number.isFinite(Number(meta.sourceTotalIncome)) && Number.isFinite(Number(meta.sourceTotalExpenses));
    let currentIncome = 0;
    let currentExpenses = 0;
    let incomeDelta = 0;
    let expenseDelta = 0;
    let balanceDelta = 0;
    let releasedProfit = 0;
    active.forEach((transaction) => {
      const amount = Math.max(0, Number(transaction.monto) || 0);
      const currentProfitWithdrawal = isProfitWithdrawal(transaction);
      if (transaction.tipo === 'ingreso') currentIncome += amount;
      if (transaction.tipo === 'gasto' && !currentProfitWithdrawal) currentExpenses += amount;
      releasedProfit += Math.max(0, Number(transaction.releasedProjectProfit) || 0);
      if (transaction.imported) {
        const originalAmount = Math.max(0, Number(transaction.originalAmount) || 0);
        const originalType = transaction.originalType || transaction.tipo;
        const originalProfitWithdrawal = normalize(transaction.originalCategory || transaction.categoria) === 'retiro de profit';
        incomeDelta += (transaction.tipo === 'ingreso' ? amount : 0) - (originalType === 'ingreso' ? originalAmount : 0);
        expenseDelta += (transaction.tipo === 'gasto' && !currentProfitWithdrawal ? amount : 0) - (originalType === 'gasto' && !originalProfitWithdrawal ? originalAmount : 0);
        balanceDelta += signedAmount(transaction.tipo, amount) - signedAmount(originalType, originalAmount);
      } else {
        if (transaction.tipo === 'ingreso') incomeDelta += amount;
        if (transaction.tipo === 'gasto' && !currentProfitWithdrawal) expenseDelta += amount;
        balanceDelta += signedAmount(transaction.tipo, amount);
      }
    });
    const income = hasSourceTotals ? Number(meta.sourceTotalIncome) + incomeDelta : currentIncome;
    const expenses = hasSourceTotals ? Number(meta.sourceTotalExpenses) + expenseDelta : currentExpenses;
    const profit = Number.isFinite(Number(meta.sourceProfitTotal))
      ? Number(meta.sourceProfitTotal) + incomeDelta - expenseDelta + releasedProfit
      : income - expenses + releasedProfit;
    return {
      income,
      expenses,
      result: profit,
      profit,
      frankProfit: profit / 2,
      releasedProfit,
      available: (Number(meta.openingBalance) || 0) + balanceDelta,
      count: active.length,
      importedCount: active.filter((transaction) => transaction.imported).length,
    };
  }

  return {
    daysUntil,
    deriveFinanceProjects,
    isRealProjectName,
    isProjectCloseRecord,
    isBusinessTransaction,
    isFrankBusinessTransaction,
    isProfitWithdrawal,
    snapshotTransaction,
    financeTotals,
    projectFinancials,
    mergeProjects,
    normalize,
    slugify,
    taskProgress,
    urgencyFor,
  };
});
