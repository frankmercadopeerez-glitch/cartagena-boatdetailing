(() => {
  "use strict";

  const Engine = window.CBDOperationsEngine;
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDkfuUmyWPdJws2wbkT_zKOLm-hXGpKdOw",
    authDomain: "finanzas-boat-detailing.firebaseapp.com",
    projectId: "finanzas-boat-detailing",
    storageBucket: "finanzas-boat-detailing.firebasestorage.app",
    messagingSenderId: "340884942708",
    appId: "1:340884942708:web:13ebbc1d6a189a30d4c621",
  };
  const FINANCE_CATEGORIES = {
    ingreso: [
      "Anticipo", "Saldo Final", "Detailing - Pulida y Encerado", "Ceramic Coating",
      "PPF (Paint Protection Film)", "Pintura de Fondo / Bottom Paint", "Pintura de Motor",
      "Pintura General / Gelcoat", "Lavado Tecnico", "Detailing Interior", "Anti-corrosion", "Otros Ingresos",
    ],
    gasto: [
      "Materiales / Insumos", "Herramientas / Equipos", "Mano de Obra", "Retiro de Profit", "ARL / Seguro",
      "Logistica / Transporte", "Arriendo / Local", "Publicidad", "Otros Gastos",
    ],
  };
  const TASK_STAGES = ["pending", "in_progress", "delivered", "warranty"];
  const TASK_STAGE_LABELS = {
    pending: "Pendiente",
    in_progress: "En proceso",
    delivered: "Entregado",
    warranty: "Garantía",
  };
  const WORK_ACCOUNT_STATUSES = ["in_process", "delivered", "warranty", "closed"];
  const WORK_ACCOUNT_LABELS = {
    in_process: "En proceso",
    delivered: "Entregado",
    warranty: "Garantía",
    closed: "Cerrado",
  };

  const els = {};
  const state = {
    auth: null,
    db: null,
    user: null,
    financeTransactions: [],
    financeMeta: null,
    operationDocs: [],
    projects: [],
    financeReady: false,
    operationsReady: false,
    currentView: "dashboard",
    selectedProject: null,
    draft: null,
    filter: "all",
    search: "",
    financeSearch: "",
    financeTypeFilter: "all",
    financeProjectFilter: "all",
    financeLimit: 60,
    subscriptions: [],
    pushServerConfig: null,
    lastPushDigest: "",
    toastTimer: null,
    showWorkAccountsSetup: false,
    financeBreakdown: "",
  };

  const byId = (id) => document.getElementById(id);
  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const formatMoney = (value) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);

  const parseMoneyInput = (value) => Math.max(0, Number(String(value || "").replace(/\D/g, "")) || 0);
  const formatMoneyInput = (value) => {
    const amount = parseMoneyInput(value);
    return amount ? new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(amount) : "";
  };

  function keepMoneyFormatted(input) {
    const formatted = formatMoneyInput(input.value);
    if (input.value !== formatted) input.value = formatted;
  }

  const formatDate = (value, options = {}) => {
    if (!value) return "Sin fecha";
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return "Sin fecha";
    return new Intl.DateTimeFormat("es-CO", {
      day: "numeric",
      month: options.long ? "long" : "short",
      ...options,
    }).format(date);
  };

  const refreshIcons = () => {
    if (window.lucide) window.lucide.createIcons({ attrs: { "stroke-width": 1.8 } });
  };

  function toast(message) {
    clearTimeout(state.toastTimer);
    els.toast.textContent = message;
    els.toast.classList.add("is-visible");
    state.toastTimer = setTimeout(() => els.toast.classList.remove("is-visible"), 2600);
  }

  function uuid(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  }

  function getProjectKey(project) {
    return Engine.normalize(project.financeProjectName || project.name);
  }

  function relativeDate(dateString) {
    const days = Engine.daysUntil(dateString);
    if (days === null) return "Sin fecha límite";
    if (days === 0) return "Vence hoy";
    if (days === 1) return "Vence mañana";
    if (days > 1) return `Faltan ${days} días`;
    if (days === -1) return "1 día de atraso";
    return `${Math.abs(days)} días de atraso`;
  }

  function urgencyLabel(urgency) {
    if (urgency === "late") return "Atención";
    if (urgency === "attention") return "Por vencer";
    return "En curso";
  }

  function reminderTypeLabel(type) {
    return type === "purchase" ? "Compra" : type === "payment" ? "Pago" : type === "deadline" ? "Fecha límite" : "Aviso";
  }

  function reminderIcon(type) {
    return type === "purchase" ? "shopping-bag" : type === "payment" ? "credit-card" : type === "deadline" ? "calendar-clock" : "bell-ring";
  }

  function defaultProject(project) {
    return {
      name: project.name,
      financeProjectName: project.financeProjectName || project.name,
      status: project.status || "in_process",
      location: project.location || "",
      startDate: project.startDate || "",
      deadline: project.deadline || "",
      scope: project.scope || "",
      notes: project.notes || "",
      clientName: project.clientName || "",
      clientPhone: project.clientPhone || "",
      responsible: project.responsible || "",
      warrantyUntil: project.warrantyUntil || "",
      blocker: project.blocker || "",
      progress: Number(project.progress) || 0,
      contractValue: Math.max(0, Number(project.contractValue) || 0),
      nextPaymentAmount: Math.max(0, Number(project.nextPaymentAmount) || 0),
      paidOpening: Math.max(0, Number(project.paidOpening) || 0),
      paidOpeningLedger: Math.max(0, Number(project.paidOpeningLedger) || 0),
      tasks: Array.isArray(project.tasks) ? project.tasks.map((item) => ({ ...item })) : [],
      workAccounts: Array.isArray(project.workAccounts) ? project.workAccounts.map((item) => ({
        id: item.id || uuid("account"),
        title: String(item.title || "Cuenta sin nombre"),
        status: WORK_ACCOUNT_STATUSES.includes(item.status) ? item.status : "in_process",
        pendingAmount: Math.max(0, Number(item.pendingAmount) || 0),
        expectedIncome: Math.max(0, Number(item.expectedIncome) || 0),
        payableWilington: Math.max(0, Number(item.payableWilington) || 0),
        otherEstimatedCost: Math.max(0, Number(item.otherEstimatedCost) || 0),
        otherCostDetails: String(item.otherCostDetails || ""),
        separateWork: Boolean(item.separateWork),
        notes: String(item.notes || ""),
      })) : [],
      reminders: Array.isArray(project.reminders) ? project.reminders.map((item) => ({ ...item })) : [],
      evidence: Array.isArray(project.evidence) ? project.evidence.map((item) => ({ ...item })) : [],
      changeLog: Array.isArray(project.changeLog) ? project.changeLog.map((item) => ({ ...item })) : [],
      docId: project.docId || "",
      finance: project.finance || null,
    };
  }

  function syncProjects() {
    state.projects = Engine.mergeProjects([], state.operationDocs).map(defaultProject);
    renderEverything();
  }

  function allReminders(includeDone = true) {
    return state.projects
      .flatMap((project) => {
        const deadlineReminder = Engine.projectDeadlineReminder(project);
        return [...(project.reminders || []), ...(deadlineReminder ? [deadlineReminder] : [])].map((reminder) => ({
          ...reminder,
          projectName: project.name,
          projectKey: getProjectKey(project),
          project,
        }));
      })
      .filter((reminder) => includeDone || !reminder.done)
      .sort((a, b) => String(a.dueDate || "9999").localeCompare(String(b.dueDate || "9999")));
  }

  function openTasks(project) {
    return (project.tasks || []).filter((task) => !task.done);
  }

  function projectProgress(project) {
    if (project.status === "completed") return 100;
    return Engine.taskProgress(project.tasks, project.progress);
  }

  function projectFinancialSummary(project) {
    return Engine.projectFinancials(project, state.financeTransactions);
  }

  function hasWorkAccounts(project) {
    return Array.isArray(project && project.workAccounts) && project.workAccounts.length > 0;
  }

  function workAccountTransactions(project, account) {
    const accountId = String(account && account.id || "");
    const accountName = Engine.normalize(account && account.title || "");
    return projectTransactions(project).filter((transaction) => {
      if (accountId && String(transaction.projectAccountId || "") === accountId) return true;
      return accountName && Engine.normalize(transaction.projectAccountName || "") === accountName;
    });
  }

  function workAccountSummary(project, account) {
    const transactions = workAccountTransactions(project, account);
    const income = transactions
      .filter((item) => item.tipo === "ingreso")
      .reduce((sum, item) => sum + Math.max(0, Number(item.monto) || 0), 0);
    const expenses = transactions
      .filter((item) => item.tipo === "gasto" && !Engine.isProfitWithdrawal(item))
      .reduce((sum, item) => sum + Math.max(0, Number(item.monto) || 0), 0);
    return {
      income,
      expenses,
      balance: income - expenses,
      pending: Math.max(0, Number(account && account.pendingAmount) || 0),
      expectedIncome: Math.max(0, Number(account && account.expectedIncome) || 0),
      payableWilington: Math.max(0, Number(account && account.payableWilington) || 0),
      otherEstimatedCost: Math.max(0, Number(account && account.otherEstimatedCost) || 0),
      count: transactions.length,
    };
  }

  function openWorkAccounts(project) {
    return (project && project.workAccounts || []).filter((account) => Math.max(0, Number(account.pendingAmount) || 0) > 0);
  }

  function projectReceivableValue(project) {
    if (hasWorkAccounts(project)) {
      return (project.workAccounts || []).reduce((sum, account) => sum + Math.max(0, Number(account.pendingAmount) || 0), 0);
    }
    const pending = projectFinancialSummary(project).pending;
    return pending === null ? 0 : pending;
  }

  function projectIssues(project) {
    const accountMode = hasWorkAccounts(project);
    const issues = Engine.projectIssues(project).filter((issue) => !(accountMode && issue.code === "missing_contract"));
    const finance = projectFinancialSummary(project);
    if (project.blocker && project.status !== "completed") {
      issues.unshift({ code: "blocker", severity: "critical", label: `Bloqueo: ${project.blocker}` });
    }
    if (accountMode) {
      openWorkAccounts(project).forEach((account) => {
        issues.push({ code: `account_collection_${account.id}`, severity: "collection", label: `${account.title}: cobrar ${formatMoney(account.pendingAmount)}` });
      });
    } else if (project.status === "completed" && finance.pending > 0) {
      issues.push({ code: "collection", severity: "collection", label: `Cobrar ${formatMoney(finance.pending)}` });
    }
    if (!accountMode && finance.pending !== null && finance.nextPaymentAmount > finance.pending) {
      issues.push({ code: "payment_mismatch", severity: "warning", label: "El próximo cobro supera el saldo pendiente" });
    }
    return issues;
  }

  function safeExternalUrl(value) {
    try {
      const url = new URL(String(value || "").trim());
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }

  function displayPending(value) {
    return value === null ? "Por definir" : formatMoney(value);
  }

  function financeOverviewCard([label, value, icon, tone, view]) {
    return `<article data-tone="${tone}"><button type="button" class="finance-overview-jump" data-finance-view="${view}" aria-controls="project-finance-detail" aria-expanded="${state.financeBreakdown === view}"><span>${escapeHtml(label)}<i data-lucide="${icon}"></i></span><strong>${escapeHtml(value)}</strong><small>Ver desglose</small></button></article>`;
  }

  function metricCard(label, value, detail, icon, tone) {
    return `<article class="metric-card" data-tone="${tone}"><div class="metric-top"><span>${escapeHtml(label)}</span><span class="metric-icon"><i data-lucide="${icon}"></i></span></div><strong>${escapeHtml(value)}</strong><small>${escapeHtml(detail)}</small></article>`;
  }

  function renderMetrics() {
    const active = state.projects.filter((project) => project.status !== "completed");
    const completed = state.projects.filter((project) => project.status === "completed");
    const attention = active.filter((project) => projectIssues(project).length > 0).length;
    const receivable = state.projects.reduce((total, project) => total + projectReceivableValue(project), 0);
    els.metricsGrid.innerHTML = [
      metricCard("Trabajos activos", active.length, `${openTasks({ tasks: active.flatMap((item) => item.tasks || []) }).length} tareas por completar`, "ship", "work"),
      metricCard("Por cobrar", formatMoney(receivable), "Saldo pendiente entre todos los trabajos", "circle-dollar-sign", "receivable"),
      metricCard("Requieren atención", attention, attention ? "Datos, bloqueos o fechas por resolver" : "La operación está al día", "triangle-alert", attention > 0 ? "attention" : "complete"),
      metricCard("Completados", completed.length, completed.length ? "Siguen visibles para cobros y garantías" : "Aún no hay trabajos cerrados", "badge-check", "complete"),
    ].join("");
  }

  function projectCard(project) {
    const isCompleted = project.status === "completed";
    const urgency = isCompleted ? "completed" : Engine.urgencyFor(project);
    const progress = projectProgress(project);
    const scope = String(project.scope || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean)[0] || "Sin resumen operativo";
    const finance = projectFinancialSummary(project);
    const deadlineClass = urgency === "late" ? "is-late" : urgency === "attention" ? "is-attention" : "";
    const statusLabel = isCompleted ? "Completado" : project.status === "paused" ? "Pausado" : !project.deadline ? "Falta fecha" : urgencyLabel(urgency);
    const receivable = projectReceivableValue(project);
    const footerStatus = isCompleted
      ? (receivable > 0 ? "Cobro pendiente" : "Cuenta cerrada")
      : relativeDate(project.deadline);
    return `<article class="project-card" data-project-key="${escapeHtml(getProjectKey(project))}" data-urgency="${urgency}" data-status="${escapeHtml(project.status)}" tabindex="0" role="button" aria-label="Abrir ${escapeHtml(project.name)}">
      <div class="project-card-head"><div><h3>${escapeHtml(project.name)}</h3>${project.location ? `<p class="location">${escapeHtml(project.location)}</p>` : ""}</div><span class="status-badge">${escapeHtml(statusLabel)}</span></div>
      <p class="project-scope">${escapeHtml(scope)}</p>
      <div class="project-card-summary"><div><span>Por cobrar</span><strong class="${receivable > 0 ? "is-pending" : ""}">${escapeHtml(formatMoney(receivable))}</strong></div><div><span>Caja</span><strong class="${finance.balance < 0 ? "is-negative" : "is-positive"}">${escapeHtml(formatMoney(finance.balance))}</strong></div></div>
      <div class="project-card-foot"><span class="deadline ${deadlineClass}"><i data-lucide="${isCompleted ? "wallet-cards" : "clock-3"}"></i>${escapeHtml(footerStatus)}</span><span><b>${progress}%</b> de avance</span></div>
      <div class="progress-track"><span style="width:${progress}%"></span></div>
    </article>`;
  }

  function renderProjectFinanceOverview() {
    if (!state.draft || !els.projectFinanceOverview) return;
    const finance = projectFinancialSummary(state.draft);
    if (hasWorkAccounts(state.draft)) {
      const accounts = state.draft.workAccounts || [];
      const movements = projectTransactions(state.draft).length;
      const pendingToWilington = accounts.reduce((sum, account) => sum + Math.max(0, Number(account.payableWilington) || 0), 0);
      const otherEstimatedCosts = accounts.reduce((sum, account) => sum + Math.max(0, Number(account.otherEstimatedCost) || 0), 0);
      const pendingReceipts = accounts.reduce((sum, account) => sum + Math.max(0, Number(account.pendingAmount) || 0), 0);
      const expectedIncome = accounts.reduce((sum, account) => sum + Math.max(0, Number(account.expectedIncome) || 0), 0);
      const estimatedProfit = finance.paid + pendingReceipts + expectedIncome - finance.expenses - pendingToWilington - otherEstimatedCosts;
      const hasForecast = pendingToWilington > 0 || otherEstimatedCosts > 0 || expectedIncome > 0;
      els.projectFinanceOverview.innerHTML = [
        ["Por cobrar", formatMoney(pendingReceipts), "circle-dollar-sign", "receivable", "receivable"],
        ...(expectedIncome > 0 ? [["Cobros previstos", formatMoney(expectedIncome), "calendar-clock", "work", "expected"]] : []),
        ...(hasForecast ? [
          ["Debo a Wilington", formatMoney(pendingToWilington), "credit-card", "expense", "wilington"],
          ["Otros costos previstos", formatMoney(otherEstimatedCosts), "receipt-text", "expense", "other"],
          ["Profit estimado", formatMoney(estimatedProfit), "chart-no-axes-combined", estimatedProfit < 0 ? "expense" : "income", "profit"],
        ] : []),
        ["Caja registrada", formatMoney(finance.balance), "wallet", finance.balance < 0 ? "expense" : "income", "cash"],
        ["Ingresos registrados", formatMoney(finance.paid), "trending-up", "income", "income"],
        ["Gastos registrados", formatMoney(finance.expenses), "trending-down", "expense", "expenses"],
        ["Movimientos", movements, "receipt-text", "neutral", "movements"],
      ].map(financeOverviewCard).join("")
        + (hasForecast ? `<p class="forecast-explain">Profit estimado = ingresos recibidos + cobros pendientes y previstos − gastos registrados − pagos y costos previstos. No es dinero disponible en cuenta.</p>` : "");
      renderProjectFinanceDetail();
      if (els.usePendingPayment) {
        els.usePendingPayment.disabled = true;
        els.usePendingPayment.textContent = "Usa cada cuenta";
      }
      return;
    }
    const items = [
      ["Valor contratado", finance.contractValue ? formatMoney(finance.contractValue) : "Por definir", "file-text", "work", "contract"],
      ["Pagado", formatMoney(finance.paid), "check", "income", "income"],
      ["Por cobrar", displayPending(finance.pending), "clock-3", "receivable", "receivable"],
      ["Gastos registrados", formatMoney(finance.expenses), "receipt-text", "expense", "expenses"],
      ["Caja del proyecto", formatMoney(finance.balance), "wallet", finance.balance < 0 ? "expense" : "income", "cash"],
      ["50% sobre caja actual", formatMoney(finance.frankPotential), "chart-no-axes-combined", "neutral", "half"],
    ];
    if (finance.nextPaymentAmount) items.splice(3, 0, ["Próximo cobro", formatMoney(finance.nextPaymentAmount), "circle-dollar-sign", "receivable", "next"]);
    els.projectFinanceOverview.innerHTML = items.map(financeOverviewCard).join("");
    renderProjectFinanceDetail();
    if (els.usePendingPayment) {
      els.usePendingPayment.disabled = !(finance.pending > 0);
      els.usePendingPayment.textContent = finance.pending > 0 ? `Usar ${formatMoney(finance.pending)}` : "Sin saldo pendiente";
    }
  }

  function financeDetailAccountRow(account, amount, description, tone, title = account.title) {
    return `<button type="button" class="finance-detail-row" data-tone="${tone}" data-finance-account-id="${escapeHtml(account.id)}"><span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(description)}</small></span><b class="${amount < 0 ? "is-negative" : ""}">${escapeHtml(formatMoney(amount))}</b><i data-lucide="arrow-down-right"></i></button>`;
  }

  function financeDetailMovementRow(transaction) {
    const amount = (transaction.tipo === "gasto" ? -1 : 1) * Math.max(0, Number(transaction.monto) || 0);
    return `<button type="button" class="finance-detail-row" data-finance-transaction-id="${escapeHtml(transaction.id)}"><span><strong>${escapeHtml(transaction.descripcion || transaction.categoria || "Movimiento")}</strong><small>${escapeHtml(formatDate(transaction.fecha))} · ${escapeHtml(transaction.projectAccountName || transaction.categoria || "Cuenta general")}</small></span><b class="${amount < 0 ? "is-negative" : ""}">${escapeHtml(formatMoney(amount))}</b><i data-lucide="arrow-down-right"></i></button>`;
  }

  function financeDetailTotalRow(title, amount, description, view = "") {
    const tag = view ? "button" : "div";
    return `<${tag} ${view ? `type="button" data-finance-view="${view}"` : ""} class="finance-detail-row"><span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(description)}</small></span><b class="${amount < 0 ? "is-negative" : ""}">${escapeHtml(formatMoney(amount))}</b>${view ? '<i data-lucide="arrow-right"></i>' : ""}</${tag}>`;
  }

  function renderProjectFinanceDetail() {
    if (!state.draft || !els.projectFinanceDetail) return;
    const view = state.financeBreakdown;
    els.projectFinanceDetail.hidden = !view;
    if (!view) return;
    const finance = projectFinancialSummary(state.draft);
    const accounts = state.draft.workAccounts || [];
    const transactions = projectTransactions(state.draft);
    const lines = [];
    const descriptions = {
      receivable: ["Por cobrar", "Saldos pendientes por frente. Toca uno para abrirlo y registrar el pago."],
      expected: ["Cobros previstos", "Ingresos esperados que aún no están registrados como recibidos."],
      wilington: ["Debo a Wilington", "Pagos pendientes. No se descuentan de la caja hasta registrar el gasto."],
      other: ["Otros costos previstos", "Costos aún no pagados. Toca un frente para ver su nota y los conceptos."],
      profit: ["Profit estimado", "Estimación por frente, incluidos los costos pendientes. No equivale a caja disponible."],
      income: ["Ingresos registrados", "Cobros que ya entraron y constan como movimientos."],
      expenses: ["Gastos registrados", "Pagos que ya salieron y constan como movimientos."],
      cash: ["Caja registrada", "Ingresos recibidos menos gastos pagados y retiros de profit."],
      movements: ["Todos los movimientos", "Toca un movimiento para localizarlo en el registro del proyecto."],
      contract: ["Valor contratado", "Valor y cobros registrados para este proyecto."],
      next: ["Próximo cobro", "Monto planeado para el siguiente pago del cliente."],
      half: ["50% sobre caja actual", "La mitad de la caja positiva registrada en este proyecto."],
    };
    const [title, help] = descriptions[view] || ["Desglose", "Detalle de la cifra seleccionada."];
    els.projectFinanceDetailTitle.textContent = title;
    els.projectFinanceDetailHelp.textContent = help;
    const accountAmount = (account) => {
      const summary = workAccountSummary(state.draft, account);
      if (view === "receivable") return summary.pending;
      if (view === "expected") return summary.expectedIncome;
      if (view === "wilington") return summary.payableWilington;
      if (view === "other") return summary.otherEstimatedCost;
      return summary.income + summary.pending + summary.expectedIncome - summary.expenses - summary.payableWilington - summary.otherEstimatedCost;
    };
    if (["receivable", "expected", "wilington", "other", "profit"].includes(view) && accounts.length) {
      accounts.forEach((account) => {
        const amount = accountAmount(account);
        if (!amount && view !== "profit") return;
        const detail = view === "profit" ? "Ingresos y cobros − gastos y costos previstos" : view === "other" ? "Ver conceptos y nota del frente" : view === "wilington" ? "Saldo pendiente de pago" : "Saldo pendiente del cliente";
        const tone = ["wilington", "other"].includes(view) ? "expense" : ["receivable", "expected"].includes(view) ? "receivable" : "income";
        if (view === "other" && account.otherCostDetails) {
          const concepts = account.otherCostDetails.split(/\r?\n/).map((line) => {
            const parts = line.split("|");
            if (parts.length < 2) return null;
            const value = parseMoneyInput(parts.pop());
            const title = parts.join("|").trim();
            return title && value ? { title, value } : null;
          }).filter(Boolean);
          if (concepts.length) {
            concepts.forEach((concept) => lines.push(financeDetailAccountRow(account, concept.value, account.title, tone, concept.title)));
            const unallocated = amount - concepts.reduce((sum, concept) => sum + concept.value, 0);
            if (unallocated) lines.push(financeDetailAccountRow(account, unallocated, "Ajustar conceptos de este frente", tone, "Diferencia sin desglosar"));
            return;
          }
        }
        lines.push(financeDetailAccountRow(account, amount, detail, tone));
      });
      if (view === "profit") {
        const accountProfit = accounts.reduce((sum, account) => sum + accountAmount(account), 0);
        const receivable = accounts.reduce((sum, account) => sum + Math.max(0, Number(account.pendingAmount) || 0), 0);
        const expected = accounts.reduce((sum, account) => sum + Math.max(0, Number(account.expectedIncome) || 0), 0);
        const costs = accounts.reduce((sum, account) => sum + Math.max(0, Number(account.payableWilington) || 0) + Math.max(0, Number(account.otherEstimatedCost) || 0), 0);
        const difference = finance.paid + receivable + expected - finance.expenses - costs - accountProfit;
        if (difference) lines.push(financeDetailTotalRow("Cuenta general y ajustes", difference, "Movimientos sin frente o saldos iniciales"));
      }
    } else if (view === "receivable" && finance.pending !== null) {
      lines.push(financeDetailTotalRow("Saldo del proyecto", finance.pending, "Valor contratado menos pagos recibidos"));
    } else if (view === "income" || view === "expenses" || view === "movements") {
      const filtered = transactions.filter((transaction) => view === "movements" || view === "income" && transaction.tipo === "ingreso" || view === "expenses" && transaction.tipo === "gasto" && !Engine.isProfitWithdrawal(transaction));
      lines.push(...filtered.map(financeDetailMovementRow));
      if (view === "income") {
        const recordedIncome = filtered.reduce((sum, transaction) => sum + Math.max(0, Number(transaction.monto) || 0), 0);
        const opening = finance.paid - recordedIncome;
        if (opening > 0) lines.push(financeDetailTotalRow("Saldo inicial registrado", opening, "Ingreso previo al registro de movimientos de este portal"));
      }
    } else if (view === "cash") {
      lines.push(financeDetailTotalRow("Ingresos recibidos", finance.paid, "Ver movimientos de ingreso", "income"));
      lines.push(financeDetailTotalRow("Gastos pagados", -finance.expenses, "Ver movimientos de gasto", "expenses"));
      if (finance.releasedProfit) lines.push(financeDetailTotalRow("Profit retirado", -finance.releasedProfit, "Ya salió de la caja del proyecto"));
    } else if (view === "contract") {
      lines.push(financeDetailTotalRow("Valor acordado", finance.contractValue, "Registrado en la ficha del proyecto"));
      lines.push(financeDetailTotalRow("Pagos recibidos", finance.paid, "Ingresos contabilizados", "income"));
    } else if (view === "next") {
      lines.push(financeDetailTotalRow("Próximo cobro", finance.nextPaymentAmount, "Se puede modificar en la ficha del proyecto"));
    } else if (view === "half") {
      lines.push(financeDetailTotalRow("Caja positiva", Math.max(0, finance.balance), "Base del cálculo", "cash"));
      lines.push(financeDetailTotalRow("Mitad de la caja", finance.frankPotential, "Estimación actual; no es un retiro"));
    }
    els.projectFinanceDetailList.innerHTML = lines.length ? lines.join("") : `<p class="finance-detail-empty">No hay conceptos registrados para esta cifra.</p>`;
  }

  function workAccountCard(account) {
    const summary = workAccountSummary(state.draft, account);
    const status = WORK_ACCOUNT_STATUSES.includes(account.status) ? account.status : "in_process";
    const statusOptions = WORK_ACCOUNT_STATUSES.map((value) =>
      `<option value="${value}"${value === status ? " selected" : ""}>${escapeHtml(WORK_ACCOUNT_LABELS[value])}</option>`,
    ).join("");
    return `<details class="work-account-card" data-work-account-id="${escapeHtml(account.id)}">
      <summary>
        <span class="work-account-summary-main"><strong>${escapeHtml(account.title)}</strong><small>${escapeHtml(WORK_ACCOUNT_LABELS[status])} · ${summary.count} movimiento${summary.count === 1 ? "" : "s"}</small></span>
        <span class="work-account-summary-money"><small>Saldo pendiente</small><strong class="${summary.pending ? "is-pending" : ""}">${escapeHtml(formatMoney(summary.pending))}</strong></span>
        <i data-lucide="chevron-down"></i>
      </summary>
      <div class="work-account-body">
        <div class="work-account-stats">
          <div><span>Ingresos</span><strong>${escapeHtml(formatMoney(summary.income))}</strong></div>
          <div><span>Gastos</span><strong>${escapeHtml(formatMoney(summary.expenses))}</strong></div>
          <div><span>Caja</span><strong>${escapeHtml(formatMoney(summary.balance))}</strong></div>
          <div><span>Cobro previsto</span><strong>${escapeHtml(formatMoney(summary.expectedIncome))}</strong></div>
          <div><span>Debo a Wilington</span><strong class="is-expense">${escapeHtml(formatMoney(summary.payableWilington))}</strong></div>
          <div><span>Otros costos previstos</span><strong class="is-expense">${escapeHtml(formatMoney(summary.otherEstimatedCost))}</strong></div>
          <div><span>Profit estimado</span><strong class="${summary.income + summary.pending + summary.expectedIncome - summary.expenses - summary.payableWilington - summary.otherEstimatedCost < 0 ? "is-expense" : "is-income"}">${escapeHtml(formatMoney(summary.income + summary.pending + summary.expectedIncome - summary.expenses - summary.payableWilington - summary.otherEstimatedCost))}</strong></div>
        </div>
        <div class="work-account-edit-grid">
          <label>Nombre<input data-account-field="title" value="${escapeHtml(account.title)}" /></label>
          <label>Estado<select data-account-field="status">${statusOptions}</select></label>
          <label>Saldo pendiente<input class="money-input" inputmode="numeric" data-account-field="pendingAmount" value="${escapeHtml(formatMoneyInput(account.pendingAmount))}" /></label>
          <label>Cobro previsto<input class="money-input" inputmode="numeric" data-account-field="expectedIncome" value="${escapeHtml(formatMoneyInput(account.expectedIncome))}" /></label>
          <label>Debo a Wilington<input class="money-input" inputmode="numeric" data-account-field="payableWilington" value="${escapeHtml(formatMoneyInput(account.payableWilington))}" /></label>
          <label>Otros costos previstos<input class="money-input" inputmode="numeric" data-account-field="otherEstimatedCost" value="${escapeHtml(formatMoneyInput(account.otherEstimatedCost))}" /></label>
          <label class="work-account-cost-lines">Conceptos de otros costos<textarea rows="2" data-account-field="otherCostDetails" placeholder="Uno por línea: Parra | 150000">${escapeHtml(account.otherCostDetails || "")}</textarea></label>
          <label class="work-account-separate"><input type="checkbox" data-account-field="separateWork"${account.separateWork ? " checked" : ""} /> Trabajo por aparte</label>
          <label class="work-account-notes">Nota<textarea rows="2" data-account-field="notes" placeholder="Origen del saldo, acuerdo o próxima acción">${escapeHtml(account.notes || "")}</textarea></label>
        </div>
        <div class="work-account-actions">
          <button type="button" class="btn btn-secondary btn-compact" data-account-movement="gasto" data-account-id="${escapeHtml(account.id)}"><i data-lucide="minus"></i>Gasto</button>
          <button type="button" class="btn btn-primary btn-compact" data-account-movement="ingreso" data-account-id="${escapeHtml(account.id)}"><i data-lucide="plus"></i>Ingreso</button>
          <button type="button" class="btn btn-danger btn-compact" data-action="delete-work-account" data-account-id="${escapeHtml(account.id)}"><i data-lucide="trash-2"></i>Eliminar</button>
        </div>
      </div>
    </details>`;
  }

  function renderWorkAccounts() {
    if (!state.draft || !els.workAccounts || !els.workAccountList) return;
    const accounts = state.draft.workAccounts || [];
    const showSetup = accounts.length > 0 || state.showWorkAccountsSetup;
    els.workAccounts.hidden = !showSetup;
    if (els.enableWorkAccounts) els.enableWorkAccounts.hidden = showSetup;
    els.workAccounts.classList.toggle("has-accounts", accounts.length > 0);
    document.querySelectorAll(".global-finance-field").forEach((field) => {
      field.hidden = accounts.length > 0;
    });
    const mainAccounts = accounts.filter((account) => !account.separateWork);
    const separateAccounts = accounts.filter((account) => account.separateWork);
    els.workAccountList.innerHTML = accounts.length
      ? `${mainAccounts.length ? `<h4 class="work-account-group-heading">Trabajo principal <span>${mainAccounts.length} frentes</span></h4>${mainAccounts.map(workAccountCard).join("")}` : ""}${separateAccounts.length ? `<h4 class="work-account-group-heading is-separate">Trabajos por aparte <span>${separateAccounts.length}</span></h4>${separateAccounts.map(workAccountCard).join("")}` : ""}`
      : `<div class="work-account-empty"><i data-lucide="layers-3"></i><div><strong>Aún no has separado este proyecto</strong><span>Escribe el primer servicio para comenzar. La cuenta general seguirá disponible hasta que lo agregues.</span></div></div>`;
  }

  function renderProjectHealth() {
    if (!state.draft || !els.projectHealth) return;
    const issues = projectIssues(state.draft);
    if (!issues.length) {
      els.projectHealth.className = "project-health is-ok";
      els.projectHealth.innerHTML = `<i data-lucide="badge-check"></i><div><strong>Ficha bajo control</strong><span>No hay inconsistencias detectadas.</span></div>`;
      return;
    }
    const critical = issues.some((issue) => issue.severity === "critical");
    els.projectHealth.className = `project-health ${critical ? "is-critical" : "is-warning"}`;
    els.projectHealth.innerHTML = `<div class="project-health-head"><i data-lucide="${critical ? "octagon-alert" : "triangle-alert"}"></i><div><strong>${issues.length} punto${issues.length === 1 ? "" : "s"} por revisar</strong><span>Toca cualquiera para ir directamente a donde se corrige.</span></div></div><ul>${issues.map((issue) => `<li><button type="button" data-action="focus-project-issue" data-issue-code="${escapeHtml(issue.code)}"><span>${escapeHtml(issue.label)}</span><i data-lucide="arrow-down"></i></button></li>`).join("")}</ul>`;
  }

  function filteredProjects() {
    const query = Engine.normalize(state.search);
    return state.projects.filter((project) => {
      const isCompleted = project.status === "completed";
      const urgency = Engine.urgencyFor(project);
      const finance = projectFinancialSummary(project);
      const matchesFilter = state.filter === "all"
        || (state.filter === "active" && !isCompleted)
        || (state.filter === "completed" && isCompleted)
        || (state.filter === "receivable" && projectReceivableValue(project) > 0)
        || (state.filter === "attention" && !isCompleted && projectIssues(project).length > 0);
      const haystack = Engine.normalize(`${project.name} ${project.scope} ${project.location} ${project.clientName} ${project.responsible} ${project.blocker}`);
      return matchesFilter && (!query || haystack.includes(query));
    });
  }

  function renderProjects() {
    const empty = `<div class="empty-state"><i data-lucide="ship-wheel"></i><strong>No hay trabajos en esta vista</strong><span>Prueba otro filtro o crea un trabajo nuevo.</span></div>`;
    const active = state.projects.filter((project) => project.status !== "completed");
    const completed = state.projects.filter((project) => project.status === "completed").sort((a, b) => {
      const pendingA = projectReceivableValue(a);
      const pendingB = projectReceivableValue(b);
      return pendingB - pendingA;
    });
    els.dashboardProjects.innerHTML = active.length ? active.slice(0, 4).map(projectCard).join("") : empty;
    els.dashboardCompleted.innerHTML = completed.length ? completed.slice(0, 3).map(projectCard).join("") : empty;
    els.dashboardCompletedPanel.hidden = !completed.length;
    const filtered = filteredProjects();
    const filteredActive = filtered.filter((project) => project.status !== "completed");
    const filteredCompleted = filtered.filter((project) => project.status === "completed");
    els.activeProjects.innerHTML = filteredActive.length ? filteredActive.map(projectCard).join("") : empty;
    els.completedProjects.innerHTML = filteredCompleted.length ? filteredCompleted.map(projectCard).join("") : empty;
    els.activeProjectSection.hidden = state.filter === "completed" || (state.filter !== "all" && !filteredActive.length);
    els.completedProjectSection.hidden = state.filter === "active" || state.filter === "attention" || (state.filter !== "all" && !filteredCompleted.length);
    els.activeProjectCount.textContent = filteredActive.length;
    els.completedProjectCount.textContent = filteredCompleted.length;
    els.navProjectCount.textContent = active.length;
  }

  function agendaItem(reminder) {
    const days = Engine.daysUntil(reminder.dueDate);
    const dateClass = days !== null && days < 0 ? "is-late" : "";
    const amount = reminder.amount ? ` · ${formatMoney(reminder.amount)}` : "";
    const isDeadline = reminder.type === "deadline";
    return `<article class="agenda-item"><span class="agenda-symbol" data-type="${escapeHtml(reminder.type)}"><i data-lucide="${reminderIcon(reminder.type)}"></i></span><div><h3>${escapeHtml(isDeadline ? reminder.projectName : reminder.title)}</h3><p>${escapeHtml(isDeadline ? "Fecha límite del trabajo" : reminder.projectName)}${escapeHtml(amount)}</p></div><span class="agenda-date ${dateClass}">${escapeHtml(formatDate(reminder.dueDate))}</span></article>`;
  }

  function renderDashboardAgenda() {
    const reminders = allReminders(false).slice(0, 6);
    els.dashboardAgenda.innerHTML = reminders.length
      ? reminders.map(agendaItem).join("")
      : `<div class="empty-state"><i data-lucide="bell-ring"></i><strong>Sin fechas próximas</strong><span>Las fechas límite y los recordatorios aparecerán aquí.</span></div>`;
  }

  function todayItem(item) {
    const meta = item.meta ? `<span>${escapeHtml(item.meta)}</span>` : "";
    const amount = Number(item.amount) > 0 ? `<small class="today-amount">Por cobrar ${escapeHtml(formatMoney(item.amount))}</small>` : "";
    return `<button class="today-item" type="button" data-action="open-today-project" data-project-key="${escapeHtml(item.projectKey)}" data-issue-code="${escapeHtml(item.issueCode || "")}" data-severity="${escapeHtml(item.severity || "normal")}"><i data-lucide="${escapeHtml(item.icon || "circle")}"></i><span><strong>${escapeHtml(item.title)}</strong>${meta}${amount}</span><i data-lucide="chevron-right"></i></button>`;
  }

  function todayColumn(title, eyebrow, icon, items, emptyText) {
    return `<section class="today-column" data-tone="${escapeHtml(eyebrow.toLowerCase())}"><div class="today-column-head"><span><i data-lucide="${icon}"></i></span><div><p>${escapeHtml(eyebrow)}</p><h3>${escapeHtml(title)}</h3></div></div><div class="today-list">${items.length ? items.map(todayItem).join("") : `<div class="today-empty"><i data-lucide="check"></i><span>${escapeHtml(emptyText)}</span></div>`}</div></section>`;
  }

  function renderTodayControl() {
    if (!els.todayControl) return;
    const urgent = [];
    const collections = [];
    const schedule = [];

    state.projects.forEach((project) => {
      const projectKey = getProjectKey(project);
      projectIssues(project)
        .filter((issue) => issue.code !== "collection" && !String(issue.code).startsWith("account_collection_"))
        .slice(0, 2)
        .forEach((issue) => urgent.push({
          title: issue.label,
          meta: project.name,
          projectKey,
          issueCode: issue.code,
          severity: issue.severity,
          icon: issue.severity === "critical" ? "octagon-alert" : "triangle-alert",
        }));
      if (hasWorkAccounts(project)) {
        openWorkAccounts(project).forEach((account) => collections.push({
          title: project.name,
          meta: account.title,
          projectKey,
          severity: project.status === "completed" ? "critical" : "collection",
          icon: "circle-dollar-sign",
          amount: Number(account.pendingAmount) || 0,
          completed: project.status === "completed",
        }));
      } else {
        const finance = projectFinancialSummary(project);
        if (finance.pending > 0) collections.push({
          title: project.name,
          meta: "Saldo pendiente",
          projectKey,
          severity: project.status === "completed" ? "critical" : "collection",
          icon: "circle-dollar-sign",
          amount: finance.pending,
          completed: project.status === "completed",
        });
      }
      (project.tasks || []).filter((task) => !task.done && task.dueDate).forEach((task) => {
        const days = Engine.daysUntil(task.dueDate);
        if (days === null || days > 7) return;
        schedule.push({ title: task.title, meta: `${project.name} · ${relativeDate(task.dueDate)}`, projectKey, severity: days < 0 ? "critical" : "normal", icon: "list-checks", dueDate: task.dueDate });
      });
    });
    allReminders(false).forEach((reminder) => {
      const days = Engine.daysUntil(reminder.dueDate);
      if (days === null || days > 7) return;
      const isDeadline = reminder.type === "deadline";
      schedule.push({ title: isDeadline ? reminder.projectName : reminder.title, meta: `${isDeadline ? "Fecha límite" : reminder.projectName} · ${relativeDate(reminder.dueDate)}`, projectKey: reminder.projectKey, severity: days < 0 ? "critical" : isDeadline && days <= 1 ? "warning" : "normal", icon: reminderIcon(reminder.type), dueDate: reminder.dueDate });
    });

    const urgentItems = urgent.slice(0, 5);
    const collectionItems = collections.sort((a, b) => Number(b.completed) - Number(a.completed) || b.amount - a.amount).slice(0, 5);
    const scheduleItems = schedule.sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate))).slice(0, 5);
    els.todayControl.innerHTML = [
      todayColumn("Corregir", "CONTROL", "shield-alert", urgentItems, "No hay inconsistencias"),
      todayColumn("Cobrar", "DINERO", "wallet-cards", collectionItems, "No hay cobros pendientes"),
      todayColumn("Próximos", "AGENDA", "calendar-clock", scheduleItems, "No hay vencimientos próximos"),
    ].join("");
    els.todayCount.textContent = urgent.length + collections.length + schedule.length;
  }

  function agendaRow(reminder) {
    const days = Engine.daysUntil(reminder.dueDate);
    const isDeadline = reminder.type === "deadline";
    const dateClass = days !== null && days < 0 ? "is-late" : "";
    const dateControl = (days === null || days < 0) && !reminder.done
      ? `<button type="button" class="agenda-date agenda-date-button ${dateClass}" data-action="reschedule-reminder"><span>${escapeHtml(formatDate(reminder.dueDate))}</span><small>${days === null ? "Poner fecha" : "Reprogramar"}</small></button>`
      : `<span class="agenda-date ${dateClass}">${escapeHtml(formatDate(reminder.dueDate))}</span>`;
    return `<article class="agenda-row${reminder.done ? " is-done" : ""}" data-type="${escapeHtml(reminder.type)}" data-project-key="${escapeHtml(reminder.projectKey)}" data-reminder-id="${escapeHtml(reminder.id)}">
      ${isDeadline ? '<span class="check-button agenda-deadline-icon" aria-hidden="true"><i data-lucide="calendar-days"></i></span>' : `<button class="check-button${reminder.done ? " is-done" : ""}" data-action="toggle-agenda" aria-label="${reminder.done ? "Reabrir" : "Completar"} recordatorio"><i data-lucide="check"></i></button>`}
      <div><h3>${escapeHtml(isDeadline ? `Fecha límite · ${reminder.projectName}` : reminder.title)}</h3><p>${escapeHtml(reminderTypeLabel(reminder.type))}</p>${reminder.amount ? `<strong class="agenda-inline-amount">${escapeHtml(formatMoney(reminder.amount))}</strong>` : ""}</div>
      <div class="agenda-owner"><h3>${escapeHtml(reminder.projectName)}</h3><p>Trabajo asociado</p></div>
      ${dateControl}
      <span class="amount">${reminder.amount ? escapeHtml(formatMoney(reminder.amount)) : "—"}</span>
      <button class="icon-button" data-action="open-agenda-project" aria-label="Abrir trabajo"><i data-lucide="arrow-up-right"></i></button>
    </article>`;
  }

  function renderAgenda() {
    const reminders = allReminders(true);
    const pending = reminders.filter((item) => !item.done);
    const overdue = pending.filter((item) => {
      const days = Engine.daysUntil(item.dueDate);
      return days !== null && days < 0;
    });
    const amount = pending
      .filter((item) => item.type === "purchase" || item.type === "payment")
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    els.agendaSummary.innerHTML = `<article class="agenda-stat"><span>Pendientes</span><strong>${pending.length}</strong></article><article class="agenda-stat"><span>Vencidos</span><strong>${overdue.length}</strong></article><article class="agenda-stat"><span>Compromisos registrados</span><strong>${escapeHtml(formatMoney(amount))}</strong></article>`;
    els.agendaTable.innerHTML = reminders.length
      ? reminders.map(agendaRow).join("")
      : `<div class="empty-state"><i data-lucide="calendar-plus"></i><strong>La agenda está limpia</strong><span>Crea recordatorios o pagos pendientes desde cualquier trabajo para verlos aquí.</span></div>`;
    els.navAlertCount.textContent = pending.length;
  }

  function filteredFinanceTransactions() {
    const query = Engine.normalize(state.financeSearch);
    return state.financeTransactions
      .filter((transaction) => {
        const typeMatches = state.financeTypeFilter === "all" || transaction.tipo === state.financeTypeFilter;
        const transactionProject = Engine.normalize(transaction.proyecto || transaction.project || "");
        const projectMatches = state.financeProjectFilter === "all"
          || (state.financeProjectFilter === "__none__" ? !transactionProject : transactionProject === Engine.normalize(state.financeProjectFilter));
        const haystack = Engine.normalize(`${transaction.descripcion} ${transaction.categoria} ${transaction.proyecto} ${transaction.projectAccountName}`);
        return typeMatches && projectMatches && (!query || haystack.includes(query));
      })
      .slice()
      .sort((a, b) => `${b.fecha || ""}T${b.hora || ""}`.localeCompare(`${a.fecha || ""}T${a.hora || ""}`));
  }

  function financeMetric(label, value, detail, icon, className = "") {
    return `<article class="finance-metric ${className}"><span>${escapeHtml(label)}<i data-lucide="${icon}"></i></span><strong>${escapeHtml(formatMoney(value))}</strong><small>${escapeHtml(detail)}</small></article>`;
  }

  function financeRow(transaction) {
    const description = transaction.descripcion || transaction.categoria || "Movimiento sin descripción";
    const sign = transaction.tipo === "gasto" ? "−" : "+";
    return `<article class="finance-row" data-finance-id="${escapeHtml(transaction.id)}">
      <div class="finance-row-date">${escapeHtml(formatDate(transaction.fecha))}${transaction.hora ? `<br>${escapeHtml(transaction.hora)}` : ""}${transaction.imported ? "<br>Histórico importado" : "<br>Registrado aquí"}</div>
      <div class="finance-row-main"><strong>${escapeHtml(description)}</strong><span>${escapeHtml(transaction.categoria || "Sin categoría")}</span></div>
      <div class="finance-row-project">${escapeHtml(transaction.proyecto || "Sin proyecto")}${transaction.projectAccountName ? `<br><span>${escapeHtml(transaction.projectAccountName)}</span>` : ""}</div>
      <span class="finance-type" data-type="${escapeHtml(transaction.tipo)}">${transaction.tipo === "gasto" ? "Gasto" : "Ingreso"}</span>
      <span class="finance-amount" data-type="${escapeHtml(transaction.tipo)}">${sign}${escapeHtml(formatMoney(transaction.monto))}</span>
      <button class="icon-button" data-action="edit-finance" aria-label="Editar movimiento"><i data-lucide="pencil"></i></button>
    </article>`;
  }

  function projectTransactions(project) {
    if (!project) return [];
    const wanted = Engine.normalize(project.financeProjectName || project.name);
    return state.financeTransactions
      .filter((transaction) => transaction.archived !== true && Engine.normalize(transaction.proyecto || transaction.project) === wanted)
      .slice()
      .sort((a, b) => `${b.fecha || ""}T${b.hora || ""}`.localeCompare(`${a.fecha || ""}T${a.hora || ""}`));
  }

  function projectLedgerRow(transaction) {
    const description = transaction.descripcion || transaction.categoria || "Movimiento sin descripción";
    const sign = transaction.tipo === "gasto" ? "−" : "+";
    const source = transaction.imported ? "Histórico" : "Registrado aquí";
    return `<article class="project-ledger-row" data-finance-id="${escapeHtml(transaction.id)}">
      <div class="project-ledger-date"><strong>${escapeHtml(formatDate(transaction.fecha))}</strong><span>${escapeHtml(transaction.hora || source)}</span></div>
      <div class="project-ledger-main"><strong>${escapeHtml(description)}</strong><span>${transaction.projectAccountName ? `${escapeHtml(transaction.projectAccountName)} · ` : ""}${escapeHtml(transaction.categoria || "Sin categoría")} · ${source}</span></div>
      <span class="finance-type" data-type="${escapeHtml(transaction.tipo)}">${transaction.tipo === "gasto" ? "Gasto" : "Ingreso"}</span>
      <strong class="finance-amount" data-type="${escapeHtml(transaction.tipo)}">${sign}${escapeHtml(formatMoney(transaction.monto))}</strong>
      <button type="button" class="icon-button project-ledger-edit" data-action="edit-finance" aria-label="Editar movimiento"><i data-lucide="pencil"></i></button>
    </article>`;
  }

  function renderProjectLedger() {
    if (!els.projectLedger || !state.draft) return;
    const transactions = projectTransactions(state.draft);
    const expenses = transactions.filter((item) => item.tipo === "gasto" && !Engine.isProfitWithdrawal(item)).reduce((sum, item) => sum + (Number(item.monto) || 0), 0);
    const income = transactions.filter((item) => item.tipo === "ingreso").reduce((sum, item) => sum + (Number(item.monto) || 0), 0);
    els.projectLedgerCaption.textContent = transactions.length
      ? `${transactions.length} movimiento${transactions.length === 1 ? "" : "s"} · ${formatMoney(income)} ingresados · ${formatMoney(expenses)} gastados`
      : "Todavía no hay ingresos ni gastos asociados a esta embarcación.";
    els.projectLedger.innerHTML = transactions.length
      ? transactions.map(projectLedgerRow).join("")
      : `<div class="project-ledger-empty"><i data-lucide="receipt-text"></i><div><strong>Cuenta sin movimientos</strong><span>Registra el primer gasto o ingreso con los botones de arriba.</span></div></div>`;
  }

  function renderFinance() {
    if (!els.financeMetrics) return;
    const totals = Engine.financeTotals(state.financeTransactions, state.financeMeta || {});
    els.financeMetrics.innerHTML = [
      financeMetric("Disponible en mi cuenta", totals.available, "Saldo disponible de Frank", "wallet", "is-primary"),
      financeMetric("Ingresos totales", totals.income, "Mismo total base de CBD Finanzas, ajustado aquí", "trending-up", "is-income"),
      financeMetric("Gastos totales", totals.expenses, "Mismo total base de CBD Finanzas, ajustado aquí", "trending-down", "is-expense"),
      financeMetric("Profit de Frank (50%)", totals.frankProfit, "Tu mitad del profit realizado; los retiros no son gasto", "chart-no-axes-combined", "is-profit"),
    ].join("");
    const cutoff = state.financeMeta && state.financeMeta.sourceCutoff;
    els.financeCutoff.textContent = cutoff
      ? `Datos históricos cargados el ${formatDate(cutoff, { long: true })}.`
      : "Datos históricos cargados en este portal.";
    const projectNames = [...new Set(state.financeTransactions.map((transaction) => (transaction.proyecto || transaction.project || "").trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "es"));
    const selectedProject = state.financeProjectFilter;
    els.financeProjectFilter.innerHTML = [
      '<option value="all">Todos los proyectos</option>',
      '<option value="__none__">Sin proyecto</option>',
      ...projectNames.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`),
    ].join("");
    els.financeProjectFilter.value = projectNames.some((name) => Engine.normalize(name) === Engine.normalize(selectedProject))
      ? projectNames.find((name) => Engine.normalize(name) === Engine.normalize(selectedProject))
      : selectedProject === "__none__" ? "__none__" : "all";
    const transactions = filteredFinanceTransactions();
    const filteredIncome = transactions.filter((item) => item.tipo === "ingreso").reduce((sum, item) => sum + (Number(item.monto) || 0), 0);
    const filteredExpenses = transactions.filter((item) => item.tipo === "gasto" && !Engine.isProfitWithdrawal(item)).reduce((sum, item) => sum + (Number(item.monto) || 0), 0);
    els.financeFilterSummary.innerHTML = `<article><span>Movimientos</span><strong>${transactions.length}</strong></article><article class="is-income"><span>Ingresos filtrados</span><strong>${escapeHtml(formatMoney(filteredIncome))}</strong></article><article class="is-expense"><span>Gastos filtrados</span><strong>${escapeHtml(formatMoney(filteredExpenses))}</strong></article><article><span>Balance filtrado</span><strong>${escapeHtml(formatMoney(filteredIncome - filteredExpenses))}</strong></article>`;
    const visibleTransactions = transactions.slice(0, state.financeLimit);
    els.financeTable.innerHTML = visibleTransactions.length
      ? visibleTransactions.map(financeRow).join("")
      : `<div class="empty-state"><i data-lucide="receipt-text"></i><strong>No hay movimientos para este filtro</strong><span>Registra un ingreso o gasto para comenzar.</span></div>`;
    els.financeShowMore.hidden = transactions.length <= state.financeLimit;
    if (!els.financeShowMore.hidden) els.financeShowMore.textContent = `Mostrar ${Math.min(60, transactions.length - state.financeLimit)} movimientos más`;
  }

  function renderFinanceCategories(selected) {
    const values = [...(FINANCE_CATEGORIES[els.financeType.value] || [])];
    if (selected && !values.includes(selected)) values.unshift(selected);
    els.financeCategory.innerHTML = values.map((category) =>
      `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`,
    ).join("");
    els.financeCategory.value = selected || values[0] || "";
  }

  function renderFinanceProjects(selected) {
    const options = state.projects.map((project) => project.financeProjectName || project.name);
    if (selected && !options.some((name) => Engine.normalize(name) === Engine.normalize(selected))) options.unshift(selected);
    els.financeProject.innerHTML = [
      '<option value="">Sin proyecto</option>',
      ...options.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`),
    ].join("");
    els.financeProject.value = selected || "";
  }

  function renderFinanceAccounts(projectName, selectedId = "", selectedName = "") {
    const draftMatches = state.draft && Engine.normalize(state.draft.financeProjectName || state.draft.name) === Engine.normalize(projectName);
    const project = draftMatches
      ? state.draft
      : state.projects.find((item) => Engine.normalize(item.financeProjectName || item.name) === Engine.normalize(projectName));
    const accounts = project && Array.isArray(project.workAccounts) ? project.workAccounts : [];
    els.financeAccountWrap.hidden = !accounts.length;
    els.financeAccount.innerHTML = [
      '<option value="">Cuenta general</option>',
      ...accounts.map((account) => `<option value="${escapeHtml(account.id)}">${escapeHtml(account.title)}</option>`),
    ].join("");
    const matched = accounts.find((account) => String(account.id) === String(selectedId))
      || accounts.find((account) => Engine.normalize(account.title) === Engine.normalize(selectedName));
    els.financeAccount.value = matched ? matched.id : "";
  }

  function openFinanceModal(type, transaction, projectName = "", projectAccountId = "", projectAccountName = "") {
    const record = transaction || {};
    els.financeId.value = record.id || "";
    els.financeType.value = record.tipo || type || "gasto";
    els.financeAmount.value = formatMoneyInput(record.monto);
    els.financeDate.value = record.fecha || new Date().toISOString().slice(0, 10);
    els.financeTime.value = record.hora || new Date().toTimeString().slice(0, 5);
    els.financeDescription.value = record.descripcion || "";
    els.financeModalTitle.textContent = record.id ? "Editar movimiento" : `Registrar ${els.financeType.value}`;
    els.financeEditNote.textContent = record.imported
      ? "Este movimiento pertenece al corte histórico. Cambiar su tipo o valor ajustará el saldo disponible desde el corte."
      : "El movimiento se guardará únicamente en este portal y actualizará inmediatamente los totales.";
    els.deleteFinanceButton.classList.toggle("is-hidden", !record.id);
    renderFinanceCategories(record.categoria || "");
    renderFinanceProjects(record.proyecto || projectName || "");
    renderFinanceAccounts(
      record.proyecto || projectName || "",
      record.projectAccountId || projectAccountId || "",
      record.projectAccountName || projectAccountName || "",
    );
    els.financeModal.showModal();
    refreshIcons();
  }

  async function saveFinanceMovement(event) {
    event.preventDefault();
    if (event.submitter && event.submitter.value === "cancel") {
      els.financeModal.close();
      return;
    }
    const id = els.financeId.value;
    const existing = state.financeTransactions.find((transaction) => transaction.id === id);
    const payload = {
      tipo: els.financeType.value,
      monto: parseMoneyInput(els.financeAmount.value),
      fecha: els.financeDate.value,
      hora: els.financeTime.value,
      categoria: els.financeCategory.value.trim(),
      proyecto: els.financeProject.value.trim(),
      projectAccountId: els.financeAccountWrap.hidden ? "" : els.financeAccount.value,
      projectAccountName: "",
      descripcion: els.financeDescription.value.trim(),
      owner: existing ? existing.owner || "Empresa" : "Frank",
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: state.user.email || state.user.uid,
    };
    if (payload.projectAccountId) {
      const draftMatches = state.draft && Engine.normalize(state.draft.financeProjectName || state.draft.name) === Engine.normalize(payload.proyecto);
      const project = draftMatches
        ? state.draft
        : state.projects.find((item) => Engine.normalize(item.financeProjectName || item.name) === Engine.normalize(payload.proyecto));
      const account = project && (project.workAccounts || []).find((item) => String(item.id) === String(payload.projectAccountId));
      payload.projectAccountName = account ? account.title : "";
    }
    if (!payload.monto || !payload.fecha || !payload.categoria) {
      toast("Completa valor, fecha y categoría");
      return;
    }
    const isProfitWithdrawal = Engine.isProfitWithdrawal(payload);
    if (isProfitWithdrawal && !payload.proyecto && !existing) {
      toast("Selecciona el proyecto cuyo saldo pasará a profit");
      return;
    }
    let releasedProjectProfit = 0;
    if (isProfitWithdrawal && payload.proyecto) {
      const sameRelease = existing
        && Engine.isProfitWithdrawal(existing)
        && Engine.normalize(existing.proyecto) === Engine.normalize(payload.proyecto);
      if (sameRelease) releasedProjectProfit = Math.max(0, Number(existing.releasedProjectProfit) || 0);
      else {
        const project = state.projects.find((item) => Engine.normalize(item.financeProjectName || item.name) === Engine.normalize(payload.proyecto));
        const transactions = existing ? state.financeTransactions.filter((item) => item.id !== existing.id) : state.financeTransactions;
        releasedProjectProfit = project ? Math.max(0, Engine.projectFinancials(project, transactions).balance) : 0;
      }
      payload.releasedProjectProfit = releasedProjectProfit;
    } else if (existing && Object.prototype.hasOwnProperty.call(existing, "releasedProjectProfit")) {
      payload.releasedProjectProfit = firebase.firestore.FieldValue.delete();
    }
    if (!existing) {
      Object.assign(payload, {
        imported: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: state.user.email || state.user.uid,
      });
    }
    els.saveFinanceButton.disabled = true;
    try {
      const collection = state.db.collection("operaciones_finanzas_transacciones");
      if (existing) await collection.doc(id).set(payload, { merge: true });
      else await collection.add(payload);
      els.financeModal.close();
      els.financeForm.reset();
      toast(releasedProjectProfit > 0
        ? `${formatMoney(releasedProjectProfit)} pasaron del proyecto a profit`
        : existing ? "Movimiento actualizado" : "Movimiento registrado");
    } catch (error) {
      console.error("No se pudo guardar el movimiento", error);
      toast("No se pudo guardar el movimiento");
    } finally {
      els.saveFinanceButton.disabled = false;
    }
  }

  async function deleteFinanceMovement() {
    const id = els.financeId.value;
    const existing = state.financeTransactions.find((transaction) => transaction.id === id);
    if (!existing) return;
    const description = existing.descripcion || existing.categoria || "este movimiento";
    if (!window.confirm(`¿Eliminar “${description}” por ${formatMoney(existing.monto)}? Esta acción ajustará los totales.`)) return;
    els.deleteFinanceButton.disabled = true;
    try {
      await state.db.collection("operaciones_finanzas_transacciones").doc(id).delete();
      els.financeModal.close();
      els.financeForm.reset();
      toast("Movimiento eliminado y totales actualizados");
    } catch (error) {
      console.error("No se pudo eliminar el movimiento", error);
      toast("No se pudo eliminar el movimiento");
    } finally {
      els.deleteFinanceButton.disabled = false;
    }
  }

  function showProjectTransactions() {
    if (!state.draft) return;
    state.financeProjectFilter = state.draft.financeProjectName || state.draft.name;
    state.financeSearch = "";
    state.financeTypeFilter = "all";
    state.financeLimit = 60;
    els.financeSearch.value = "";
    els.financeTypeFilter.value = "all";
    closeProject();
    showView("finance");
    renderFinance();
    refreshIcons();
  }

  function renderEverything() {
    renderMetrics();
    renderTodayControl();
    renderProjects();
    renderDashboardAgenda();
    renderAgenda();
    renderFinance();
    renderProjectLedger();
    if (state.draft) {
      renderProjectHealth();
      renderWorkAccounts();
      renderEvidence();
    }
    refreshIcons();
  }

  function showView(view) {
    state.currentView = view;
    document.querySelectorAll(".view").forEach((node) => node.classList.toggle("is-active", node.id === `view-${view}`));
    document.querySelectorAll("[data-view]").forEach((node) => node.classList.toggle("is-active", node.dataset.view === view));
    els.viewTitle.textContent = view === "dashboard" ? "Centro de operaciones" : view === "projects" ? "Trabajos y cobros" : view === "finance" ? "Transacciones" : "Agenda operativa";
    window.scrollTo({ top: 0, behavior: "smooth" });
    refreshIcons();
  }

  function findProject(key) {
    return state.projects.find((project) => getProjectKey(project) === key);
  }

  function openProject(project) {
    if (!project) return;
    state.selectedProject = project;
    state.draft = defaultProject(project);
    state.showWorkAccountsSetup = false;
    state.financeBreakdown = "";
    const finance = projectFinancialSummary(project);
    const accountMode = hasWorkAccounts(project);
    els.drawerTitle.textContent = project.name;
    els.drawerSubtitle.textContent = accountMode
      ? `${project.workAccounts.filter((account) => !account.separateWork).length} frentes del trabajo principal · ${project.workAccounts.filter((account) => account.separateWork).length} por aparte`
      : project.status === "completed"
      ? (finance.pending > 0 ? `Trabajo completado · falta cobrar ${formatMoney(finance.pending)}` : "Trabajo completado y pagado")
      : "Control operativo del trabajo";
    els.projectDocId.value = project.docId || "";
    els.projectStatus.value = state.draft.status;
    els.projectLocation.value = state.draft.location;
    els.projectResponsible.value = state.draft.responsible;
    els.projectStart.value = state.draft.startDate;
    els.projectDeadline.value = state.draft.deadline;
    els.projectWarrantyUntil.value = state.draft.warrantyUntil;
    els.projectContractValue.value = formatMoneyInput(state.draft.contractValue);
    els.projectNextPayment.value = formatMoneyInput(state.draft.nextPaymentAmount);
    els.projectScope.value = state.draft.scope;
    els.projectBlocker.value = state.draft.blocker;
    els.projectNotes.value = state.draft.notes;
    renderDraftLists();
    els.saveStatus.textContent = "Guardado y sincronizado";
    els.projectDrawer.classList.add("is-open");
    els.drawerBackdrop.classList.add("is-open");
    els.projectDrawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    refreshIcons();
  }

  function closeProject() {
    els.projectDrawer.classList.remove("is-open");
    els.drawerBackdrop.classList.remove("is-open");
    els.projectDrawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    state.selectedProject = null;
    state.draft = null;
    state.showWorkAccountsSetup = false;
    state.financeBreakdown = "";
  }

  function taskItem(task) {
    const stage = TASK_STAGES.includes(task.stage) ? task.stage : task.done ? "delivered" : "pending";
    const meta = task.dueDate ? formatDate(task.dueDate) : "Sin fecha";
    return `<article class="editable-item${task.done ? " is-done" : ""}" data-task-id="${escapeHtml(task.id)}"><button type="button" class="check-button${task.done ? " is-done" : ""}" data-action="toggle-task" aria-label="${task.done ? "Reabrir" : "Completar"} frente"><i data-lucide="check"></i></button><div><p class="item-title">${escapeHtml(task.title)}</p><p class="item-meta">${escapeHtml(meta)}</p></div><button type="button" class="mini-badge stage-badge" data-stage="${stage}" data-action="cycle-task-stage" aria-label="Cambiar estado del frente">${TASK_STAGE_LABELS[stage]}</button><button type="button" class="delete-button" data-action="delete-task" aria-label="Eliminar frente"><i data-lucide="trash-2"></i></button></article>`;
  }

  function reminderItem(reminder) {
    const meta = `${formatDate(reminder.dueDate)}${reminder.amount ? ` · ${formatMoney(reminder.amount)}` : ""} · ${reminder.dueDate ? `aviso ${Number(reminder.alertDays) || 0} día(s) antes` : "sin aviso programado"}`;
    const days = Engine.daysUntil(reminder.dueDate);
    const needsDate = !reminder.done && (days === null || days < 0);
    const reschedule = needsDate ? `<button type="button" class="mini-action" data-action="reschedule-reminder"><i data-lucide="calendar-clock"></i>${days === null ? "Poner fecha" : "Reprogramar"}</button>` : "";
    return `<article class="editable-item${reminder.done ? " is-done" : ""}" data-reminder-id="${escapeHtml(reminder.id)}"><button type="button" class="check-button${reminder.done ? " is-done" : ""}" data-action="toggle-reminder" aria-label="${reminder.done ? "Reabrir" : "Completar"} alerta"><i data-lucide="check"></i></button><div><p class="item-title">${escapeHtml(reminder.title)}</p><p class="item-meta">${escapeHtml(meta)}</p></div><span class="mini-badge" data-type="${escapeHtml(reminder.type)}">${reminderTypeLabel(reminder.type)}</span>${reschedule}<button type="button" class="delete-button" data-action="delete-reminder" aria-label="Eliminar alerta"><i data-lucide="trash-2"></i></button></article>`;
  }

  function evidenceItem(item) {
    const icons = { photo: "image", receipt: "receipt-text", document: "file-text", approval: "badge-check" };
    const labels = { photo: "Foto", receipt: "Recibo", document: "Documento", approval: "Aprobación" };
    const url = safeExternalUrl(item.url);
    return `<article class="evidence-item" data-evidence-id="${escapeHtml(item.id)}"><span class="evidence-icon"><i data-lucide="${icons[item.type] || "paperclip"}"></i></span><div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(labels[item.type] || "Evidencia")}${item.addedAt ? ` · ${escapeHtml(formatDate(String(item.addedAt).slice(0, 10)))}` : ""}</span></div>${url ? `<a class="icon-button" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir evidencia"><i data-lucide="external-link"></i></a>` : ""}<button type="button" class="delete-button" data-action="delete-evidence" aria-label="Eliminar evidencia"><i data-lucide="trash-2"></i></button></article>`;
  }

  function renderEvidence() {
    if (!state.draft || !els.evidenceList) return;
    const evidence = state.draft.evidence || [];
    els.evidenceList.innerHTML = evidence.length
      ? evidence.map(evidenceItem).join("")
      : `<div class="empty-state"><strong>Sin evidencias todavía</strong><span>Agrega enlaces de fotos, recibos, documentos o aprobaciones.</span></div>`;
  }

  function renderDraftLists() {
    if (!state.draft) return;
    const tasks = state.draft.tasks || [];
    const reminders = state.draft.reminders || [];
    const progress = projectProgress(state.draft);
    els.taskList.innerHTML = tasks.length ? tasks.map(taskItem).join("") : `<div class="empty-state"><strong>Sin tareas todavía</strong><span>Divide el alcance en etapas claras para medir el avance.</span></div>`;
    els.reminderList.innerHTML = reminders.length ? reminders.map(reminderItem).join("") : `<div class="empty-state"><strong>Sin compromisos todavía</strong><span>Registra aquí compras, pagos o avisos. Puedes añadir la fecha después.</span></div>`;
    els.drawerProgress.textContent = `${progress}%`;
    els.drawerProgressBar.style.width = `${progress}%`;
    els.saveStatus.textContent = "Cambios pendientes de guardar";
    renderProjectFinanceOverview();
    renderWorkAccounts();
    renderProjectHealth();
    renderProjectLedger();
    renderEvidence();
    refreshIcons();
  }

  function collectDraftForm() {
    if (!state.draft) return;
    const scope = els.projectScope.value.trim();
    const existingTitles = new Set((state.draft.tasks || []).map((task) => Engine.normalize(task.title)));
    scope.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).forEach((title) => {
      if (existingTitles.has(Engine.normalize(title))) return;
      state.draft.tasks.push({ id: uuid("task"), title, dueDate: "", stage: "pending", done: false });
      existingTitles.add(Engine.normalize(title));
    });
    Object.assign(state.draft, {
      status: els.projectStatus.value,
      location: els.projectLocation.value.trim(),
      responsible: els.projectResponsible.value.trim(),
      startDate: els.projectStart.value,
      deadline: els.projectDeadline.value,
      warrantyUntil: els.projectWarrantyUntil.value,
      contractValue: parseMoneyInput(els.projectContractValue.value),
      nextPaymentAmount: parseMoneyInput(els.projectNextPayment.value),
      scope,
      blocker: els.projectBlocker.value.trim(),
      notes: els.projectNotes.value.trim(),
      progress: Engine.taskProgress(state.draft.tasks, state.draft.progress),
    });
  }

  async function saveProject() {
    if (!state.draft || !state.user) return;
    collectDraftForm();
    const id = state.draft.docId || `finance-${Engine.slugify(state.draft.financeProjectName || state.draft.name)}`;
    const payload = {
      name: state.draft.name,
      financeProjectName: state.draft.financeProjectName || state.draft.name,
      status: state.draft.status,
      location: state.draft.location,
      clientName: state.draft.clientName,
      clientPhone: state.draft.clientPhone,
      responsible: state.draft.responsible,
      startDate: state.draft.startDate,
      deadline: state.draft.deadline,
      warrantyUntil: state.draft.warrantyUntil,
      contractValue: state.draft.contractValue,
      nextPaymentAmount: state.draft.nextPaymentAmount,
      paidOpening: state.draft.paidOpening,
      paidOpeningLedger: state.draft.paidOpeningLedger,
      scope: state.draft.scope,
      blocker: state.draft.blocker,
      notes: state.draft.notes,
      progress: state.draft.progress,
      tasks: state.draft.tasks,
      workAccounts: state.draft.workAccounts,
      reminders: state.draft.reminders,
      evidence: state.draft.evidence,
      changeLog: [...(state.draft.changeLog || []), { at: new Date().toISOString(), by: state.user.email || state.user.uid, action: "Ficha actualizada" }].slice(-20),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: state.user.email || state.user.uid,
    };
    els.saveProjectButton.disabled = true;
    els.saveStatus.textContent = "Guardando en Firebase…";
    try {
      await state.db.collection("operaciones_proyectos").doc(id).set(payload, { merge: true });
      els.saveStatus.textContent = "Guardado y sincronizado";
      toast("Trabajo actualizado");
      syncPushSchedules([{ ...state.draft, docId: id }], false).catch((error) => console.warn("No se actualizó la agenda push", error));
    } catch (error) {
      console.error("No se pudo guardar el trabajo", error);
      els.saveStatus.textContent = "No se pudo guardar. Revisa la conexión.";
      toast("Error al guardar el trabajo");
    } finally {
      els.saveProjectButton.disabled = false;
    }
  }

  async function createProject(event) {
    event.preventDefault();
    if (event.submitter && event.submitter.value === "cancel") {
      els.newProjectModal.close();
      els.newProjectForm.reset();
      return;
    }
    const name = byId("new-name").value.trim();
    if (!name) return;
    const deadline = byId("new-deadline").value;
    if (!deadline) {
      byId("new-deadline").reportValidity();
      return;
    }
    const id = `custom-${Engine.slugify(name)}-${Date.now().toString(36)}`;
    const scope = byId("new-scope").value.trim();
    const tasks = scope.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((title) => ({
      id: uuid("task"), title, dueDate: "", stage: "pending", done: false,
    }));
    const payload = {
      name,
      financeProjectName: "",
      status: "in_process",
      location: "",
      deadline,
      contractValue: parseMoneyInput(els.newContractValue.value),
      startDate: new Date().toISOString().slice(0, 10),
      scope,
      notes: "",
      clientName: "",
      clientPhone: "",
      responsible: "",
      warrantyUntil: "",
      blocker: "",
      progress: 0,
      tasks,
      workAccounts: [],
      reminders: [],
      evidence: [],
      changeLog: [{ at: new Date().toISOString(), by: state.user.email || state.user.uid, action: "Trabajo creado" }],
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: state.user.email || state.user.uid,
    };
    try {
      await state.db.collection("operaciones_proyectos").doc(id).set(payload);
      els.newProjectModal.close();
      els.newProjectForm.reset();
      toast("Trabajo creado");
      syncPushSchedules([{ ...payload, docId: id }], false).catch((error) => {
        console.warn("No se programaron los avisos del nuevo trabajo", error);
        toast("Trabajo creado; no se pudieron programar los avisos. Reintenta desde Alertas.");
      });
    } catch (error) {
      console.error("No se pudo crear el trabajo", error);
      toast("No se pudo crear el trabajo");
    }
  }

  async function deleteProject() {
    if (!state.draft || !state.user) return;
    const approved = window.confirm(`¿Borrar “${state.draft.name}” de Operaciones? Sus movimientos financieros no se borrarán.`);
    if (!approved) return;
    const id = state.draft.docId || `finance-${Engine.slugify(state.draft.financeProjectName || state.draft.name)}`;
    els.deleteProjectButton.disabled = true;
    try {
      await state.db.collection("operaciones_proyectos").doc(id).set({
        archived: true,
        status: "deleted",
        archivedAt: firebase.firestore.FieldValue.serverTimestamp(),
        archivedBy: state.user.email || state.user.uid,
      }, { merge: true });
      closeProject();
      toast("Proyecto borrado de Operaciones");
    } catch (error) {
      console.error("No se pudo borrar el proyecto", error);
      toast("No se pudo borrar el proyecto");
    } finally {
      els.deleteProjectButton.disabled = false;
    }
  }

  async function toggleAgendaReminder(projectKey, reminderId) {
    const project = findProject(projectKey);
    if (!project) return;
    openProject(project);
    const reminder = state.draft.reminders.find((item) => item.id === reminderId);
    if (!reminder) return;
    reminder.done = !reminder.done;
    await saveProject();
    closeProject();
  }

  function dateFromToday(days) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + Number(days || 0));
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function openRescheduleModal(projectKey, reminderId) {
    const project = findProject(projectKey) || (state.draft && getProjectKey(state.draft) === projectKey ? state.draft : null);
    const reminder = project && (reminderId === "project-deadline"
      ? Engine.projectDeadlineReminder(project)
      : (project.reminders || []).find((item) => item.id === reminderId));
    if (!project || !reminder) return toast("No encontré ese recordatorio");
    const isDeadline = reminderId === "project-deadline";
    const needsDate = !reminder.dueDate;
    els.rescheduleProjectKey.value = projectKey;
    els.rescheduleReminderId.value = reminderId;
    els.rescheduleTitle.textContent = isDeadline ? `${reminder.title} · ${project.name}` : reminder.title;
    els.rescheduleModal.querySelector(".modal-heading .eyebrow").textContent = isDeadline ? "REPROGRAMAR FECHA LÍMITE" : needsDate ? "PONER FECHA" : "REPROGRAMAR AVISO";
    els.rescheduleModal.querySelector(".reschedule-copy").textContent = isDeadline
      ? "Se actualizará la fecha límite del trabajo y sus avisos programados."
      : needsDate
      ? "El pago seguirá pendiente hasta que lo marques como completado. Con alertas activas, recibirás avisos antes de la fecha elegida."
      : "El compromiso seguirá pendiente y sus avisos pasarán a la nueva fecha.";
    els.rescheduleDate.value = dateFromToday(1);
    els.rescheduleModal.showModal();
    refreshIcons();
  }

  async function saveRescheduledReminder(event) {
    event.preventDefault();
    const projectKey = els.rescheduleProjectKey.value;
    const reminderId = els.rescheduleReminderId.value;
    const dueDate = els.rescheduleDate.value;
    const project = findProject(projectKey);
    if (!project || !dueDate) return;
    const isDeadline = reminderId === "project-deadline";
    const reminders = (project.reminders || []).map((item) => item.id === reminderId
      ? { ...item, dueDate, done: false, rescheduledAt: new Date().toISOString() }
      : item);
    const docId = project.docId || `finance-${Engine.slugify(project.financeProjectName || project.name)}`;
    const submit = els.rescheduleForm.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      await state.db.collection("operaciones_proyectos").doc(docId).set({
        ...(isDeadline ? { deadline: dueDate } : { reminders }),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedBy: state.user.email || state.user.uid,
      }, { merge: true });
      if (state.draft && getProjectKey(state.draft) === projectKey) {
        if (isDeadline) {
          state.draft.deadline = dueDate;
          els.projectDeadline.value = dueDate;
        } else {
          state.draft.reminders = reminders.map((item) => ({ ...item }));
          renderDraftLists();
        }
      }
      els.rescheduleModal.close();
      toast(`${isDeadline ? "Fecha límite" : "Recordatorio"} reprogramado para ${formatDate(dueDate)}`);
    } catch (error) {
      console.error("No se pudo reprogramar el recordatorio", error);
      toast("No se pudo guardar la nueva fecha");
    } finally {
      submit.disabled = false;
    }
  }

  function focusProjectIssue(code) {
    if (!state.draft || !code) return;
    let target = null;
    const firstMatchingItem = (container, items, predicate, attribute) => {
      const item = (items || []).find(predicate);
      if (!item || !container) return null;
      return Array.from(container.querySelectorAll(`[${attribute}]`)).find((node) => node.dataset[attribute.replace("data-", "").replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] === item.id) || null;
    };
    const targets = {
      blocker: els.projectBlocker,
      missing_location: els.projectLocation,
      missing_deadline: els.projectDeadline,
      missing_contract: els.projectContractValue,
      missing_scope: els.projectScope,
      missing_checklist: els.taskTitle,
      ready_to_close: els.projectStatus,
      late_deadline: els.projectDeadline,
      collection: els.projectNextPayment,
      payment_mismatch: els.projectNextPayment,
    };
    target = targets[code] || null;
    if (code === "completed_open_tasks") {
      target = firstMatchingItem(els.taskList, state.draft.tasks, (item) => !item.done, "data-task-id") || els.taskTitle;
    }
    if (code === "overdue_tasks") {
      target = firstMatchingItem(els.taskList, state.draft.tasks, (item) => !item.done && Engine.daysUntil(item.dueDate) < 0, "data-task-id") || els.taskTitle;
    }
    if (code === "overdue_reminders") {
      target = firstMatchingItem(els.reminderList, state.draft.reminders, (item) => !item.done && Engine.daysUntil(item.dueDate) < 0, "data-reminder-id") || els.reminderTitle;
    }
    if (String(code).startsWith("account_collection_")) {
      const accountId = String(code).replace("account_collection_", "");
      target = Array.from(els.workAccountList.querySelectorAll("[data-work-account-id]")).find((node) => node.dataset.workAccountId === accountId) || els.workAccounts;
      if (target.tagName === "DETAILS") target.open = true;
    }
    if (!target) return;
    const highlight = target.closest(".editable-item, .work-account-card, label, .drawer-section") || target;
    highlight.classList.remove("is-focus-target");
    void highlight.offsetWidth;
    highlight.classList.add("is-focus-target");
    highlight.scrollIntoView({ behavior: "smooth", block: "center" });
    if (/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(target.tagName)) {
      setTimeout(() => target.focus({ preventScroll: true }), 350);
    }
    setTimeout(() => highlight.classList.remove("is-focus-target"), 2200);
  }

  function parseQuickAmount(text) {
    const match = Engine.normalize(text).match(/(\d[\d.,]*)\s*(millones?|millon|millón|mil|k)?/i);
    if (!match) return 0;
    const unit = Engine.normalize(match[2]);
    const decimalValue = Number(match[1].replace(",", "."));
    let value = unit ? decimalValue : Number(match[1].replace(/[.,]/g, ""));
    if (unit.startsWith("millon") || unit.startsWith("millón")) value *= 1000000;
    else if (unit === "mil" || unit === "k") value *= 1000;
    else if (value < 1000) return 0;
    return Math.round(value) || 0;
  }

  function matchQuickProject(text) {
    const normalized = Engine.normalize(text);
    return state.projects
      .map((project) => {
        const full = Engine.normalize(project.name);
        const short = full.replace(/^(yate|bote|botes|velero|lancha)\s+/, "");
        const score = normalized.includes(full) ? full.length + 100 : short.length > 2 && normalized.includes(short) ? short.length : 0;
        return { project, score };
      })
      .sort((a, b) => b.score - a.score)
      .find((item) => item.score > 0)?.project || null;
  }

  function quickDate(text) {
    const date = new Date();
    const normalized = Engine.normalize(text);
    if (normalized.includes("manana") || normalized.includes("mañana")) date.setDate(date.getDate() + 1);
    return date.toISOString().slice(0, 10);
  }

  function inferFinanceCategory(type, text) {
    const normalized = Engine.normalize(text);
    if (type === "ingreso") {
      if (normalized.includes("anticipo")) return "Anticipo";
      if (normalized.includes("saldo")) return "Saldo Final";
      if (/(pintura|gelcoat)/.test(normalized)) return "Pintura General / Gelcoat";
      if (/(pulid|encerad)/.test(normalized)) return "Detailing - Pulida y Encerado";
      return "Otros Ingresos";
    }
    if (/(arl|seguro)/.test(normalized)) return "ARL / Seguro";
    if (/(patio|arriendo|local)/.test(normalized)) return "Arriendo / Local";
    if (/(trabajador|ayudante|fibrero|mano de obra|anticipo a)/.test(normalized)) return "Mano de Obra";
    if (/(transporte|domicilio|grua|grúa)/.test(normalized)) return "Logistica / Transporte";
    if (/(herramienta|equipo|alquiler)/.test(normalized)) return "Herramientas / Equipos";
    if (/(publicidad|anuncio)/.test(normalized)) return "Publicidad";
    if (/(pintura|lija|gelcoat|pasta|insumo|material)/.test(normalized)) return "Materiales / Insumos";
    return "Otros Gastos";
  }

  function prepareQuickCapture(text) {
    const value = String(text || "").trim();
    if (!value) return toast("Escribe lo que ocurrió");
    const normalized = Engine.normalize(value);
    const project = matchQuickProject(value);
    const amount = parseQuickAmount(value);
    const expense = /(gaste|gasté|gastaron|gastamos|gasto|pague|pagué|pagaron|pago a|pago de|compre|compré|compramos)/.test(normalized);
    const income = /(recibi|recibí|ingreso|abonaron|abono del cliente|me pagaron|pago recibido)/.test(normalized);
    const hasDateCue = /(hoy|manana|mañana|recordar|recuerd)/.test(normalized);

    if (expense || income) {
      const type = income ? "ingreso" : "gasto";
      openFinanceModal(type, null, project ? project.financeProjectName || project.name : "");
      if (amount) els.financeAmount.value = formatMoneyInput(amount);
      els.financeDescription.value = value;
      renderFinanceCategories(inferFinanceCategory(type, value));
      els.quickCaptureStatus.textContent = `Movimiento preparado${project ? ` para ${project.name}` : ""}. Revisa y confirma.`;
      toast("Movimiento preparado para revisar");
      return;
    }

    if (hasDateCue || /(comprar|pagar|llamar|revisar)/.test(normalized)) {
      if (!project) {
        els.quickCaptureStatus.textContent = "No identifiqué el proyecto. Incluye el nombre de la embarcación.";
        return toast("Indica para qué proyecto es el recordatorio");
      }
      openProject(project);
      els.reminderType.value = /comprar|compra/.test(normalized) ? "purchase" : /pagar|pago/.test(normalized) ? "payment" : "general";
      els.reminderTitle.value = value;
      els.reminderDate.value = quickDate(value);
      if (amount) els.reminderAmount.value = amount;
      setTimeout(() => els.reminderTitle.focus(), 150);
      els.quickCaptureStatus.textContent = `Recordatorio preparado para ${project.name}.`;
      toast("Revisa el recordatorio y agrégalo");
      return;
    }

    if (project) {
      openProject(project);
      els.taskTitle.value = value;
      setTimeout(() => els.taskTitle.focus(), 150);
      els.quickCaptureStatus.textContent = `Tarea preparada para ${project.name}.`;
      toast("Revisa la tarea y agrégala");
      return;
    }

    els.quickCaptureStatus.textContent = "No pude identificar el tipo ni el proyecto. Prueba: “Gasté 180 mil en pintura para Antigone”.";
    toast("Incluye el proyecto y lo que ocurrió");
  }

  function startQuickDictation() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return toast("El dictado no está disponible en este navegador");
    const recognition = new SpeechRecognition();
    recognition.lang = "es-CO";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    els.quickCaptureMic.classList.add("is-listening");
    els.quickCaptureStatus.textContent = "Escuchando…";
    recognition.onresult = (event) => {
      els.quickCaptureInput.value = event.results[0][0].transcript;
      els.quickCaptureStatus.textContent = "Dictado listo. Pulsa “Preparar registro”.";
    };
    recognition.onerror = () => { els.quickCaptureStatus.textContent = "No se pudo completar el dictado."; };
    recognition.onend = () => els.quickCaptureMic.classList.remove("is-listening");
    recognition.start();
  }

  function installEventHandlers() {
    document.addEventListener("click", (event) => {
      const viewButton = event.target.closest("[data-view]");
      if (viewButton) showView(viewButton.dataset.view);

      const card = event.target.closest(".project-card");
      if (card) openProject(findProject(card.dataset.projectKey));

      const financeView = event.target.closest("[data-finance-view]");
      if (financeView && state.draft) {
        state.financeBreakdown = financeView.dataset.financeView;
        renderProjectFinanceOverview();
        refreshIcons();
        els.projectFinanceDetail.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      const financeAccount = event.target.closest("[data-finance-account-id]");
      if (financeAccount && state.draft) {
        const account = Array.from(els.workAccountList.querySelectorAll("[data-work-account-id]")).find((item) => item.dataset.workAccountId === financeAccount.dataset.financeAccountId);
        if (account) {
          account.open = true;
          account.scrollIntoView({ behavior: "smooth", block: "center" });
          account.classList.add("is-finance-target");
          setTimeout(() => account.classList.remove("is-finance-target"), 2200);
        }
        return;
      }
      const financeTransaction = event.target.closest("[data-finance-transaction-id]");
      if (financeTransaction && state.draft) {
        const row = Array.from(els.projectLedger.querySelectorAll("[data-finance-id]")).find((item) => item.dataset.financeId === financeTransaction.dataset.financeTransactionId);
        if (row) {
          row.scrollIntoView({ behavior: "smooth", block: "center" });
          row.classList.add("is-finance-target");
          setTimeout(() => row.classList.remove("is-finance-target"), 2200);
        }
        return;
      }

      const newMovement = event.target.closest("[data-new-movement]");
      if (newMovement) openFinanceModal(newMovement.dataset.newMovement);

      const projectMovement = event.target.closest("[data-project-movement]");
      if (projectMovement && state.draft) {
        openFinanceModal(
          projectMovement.dataset.projectMovement,
          null,
          state.draft.financeProjectName || state.draft.name,
        );
      }

      const accountMovement = event.target.closest("[data-account-movement]");
      if (accountMovement && state.draft) {
        const account = (state.draft.workAccounts || []).find((item) => item.id === accountMovement.dataset.accountId);
        if (account) {
          openFinanceModal(
            accountMovement.dataset.accountMovement,
            null,
            state.draft.financeProjectName || state.draft.name,
            account.id,
            account.title,
          );
        }
      }

      const action = event.target.closest("[data-action]");
      if (!action) return;
      const taskNode = action.closest("[data-task-id]");
      const reminderNode = action.closest("[data-reminder-id]");
      const evidenceNode = action.closest("[data-evidence-id]");
      if (action.dataset.action === "open-today-project") {
        openProject(findProject(action.dataset.projectKey));
        if (action.dataset.issueCode) setTimeout(() => focusProjectIssue(action.dataset.issueCode), 180);
      }
      if (action.dataset.action === "focus-project-issue") {
        focusProjectIssue(action.dataset.issueCode);
      }
      if (action.dataset.action === "reschedule-reminder" && reminderNode) {
        const projectKey = reminderNode.dataset.projectKey || (state.draft ? getProjectKey(state.draft) : "");
        openRescheduleModal(projectKey, reminderNode.dataset.reminderId);
      }
      if (action.dataset.action === "toggle-task" && taskNode) {
        const task = state.draft.tasks.find((item) => item.id === taskNode.dataset.taskId);
        if (task) {
          task.done = !task.done;
          task.stage = task.done ? "delivered" : "pending";
        }
        renderDraftLists();
      }
      if (action.dataset.action === "cycle-task-stage" && taskNode) {
        const task = state.draft.tasks.find((item) => item.id === taskNode.dataset.taskId);
        if (task) {
          const current = TASK_STAGES.includes(task.stage) ? task.stage : task.done ? "delivered" : "pending";
          task.stage = TASK_STAGES[(TASK_STAGES.indexOf(current) + 1) % TASK_STAGES.length];
          task.done = task.stage === "delivered";
        }
        renderDraftLists();
      }
      if (action.dataset.action === "delete-task" && taskNode) {
        state.draft.tasks = state.draft.tasks.filter((item) => item.id !== taskNode.dataset.taskId);
        renderDraftLists();
      }
      if (action.dataset.action === "toggle-reminder" && reminderNode) {
        const reminder = state.draft.reminders.find((item) => item.id === reminderNode.dataset.reminderId);
        if (reminder) reminder.done = !reminder.done;
        renderDraftLists();
      }
      if (action.dataset.action === "delete-reminder" && reminderNode) {
        state.draft.reminders = state.draft.reminders.filter((item) => item.id !== reminderNode.dataset.reminderId);
        renderDraftLists();
      }
      if (action.dataset.action === "delete-evidence" && evidenceNode) {
        state.draft.evidence = state.draft.evidence.filter((item) => item.id !== evidenceNode.dataset.evidenceId);
        renderDraftLists();
      }
      if (action.dataset.action === "delete-work-account" && state.draft) {
        const account = (state.draft.workAccounts || []).find((item) => item.id === action.dataset.accountId);
        if (!account) return;
        if (!window.confirm(`¿Eliminar la cuenta “${account.title}”? Los movimientos no se borrarán, pero quedarán en la cuenta general.`)) return;
        state.draft.workAccounts = state.draft.workAccounts.filter((item) => item.id !== account.id);
        renderDraftLists();
      }
      if (action.dataset.action === "toggle-agenda" && reminderNode) {
        toggleAgendaReminder(reminderNode.dataset.projectKey, reminderNode.dataset.reminderId);
      }
      if (action.dataset.action === "open-agenda-project" && reminderNode) {
        openProject(findProject(reminderNode.dataset.projectKey));
      }
      if (action.dataset.action === "edit-finance") {
        const row = action.closest("[data-finance-id]");
        openFinanceModal("", state.financeTransactions.find((transaction) => transaction.id === row.dataset.financeId));
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && els.projectDrawer.classList.contains("is-open")) closeProject();
      if ((event.key === "Enter" || event.key === " ") && event.target.classList.contains("project-card")) {
        event.preventDefault();
        openProject(findProject(event.target.dataset.projectKey));
      }
    });

    els.loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      els.authError.textContent = "";
      els.loginButton.disabled = true;
      els.loginButton.textContent = "Verificando…";
      try {
        await state.auth.signInWithEmailAndPassword(els.authEmail.value.trim(), els.authPassword.value);
      } catch (error) {
        els.authError.textContent = "Correo o contraseña incorrectos.";
      } finally {
        els.loginButton.disabled = false;
        els.loginButton.textContent = "Ingresar al portal";
      }
    });

    els.logoutButton.addEventListener("click", () => state.auth.signOut());
    els.closeDrawerButton.addEventListener("click", closeProject);
    els.drawerBackdrop.addEventListener("click", closeProject);
    els.saveProjectButton.addEventListener("click", saveProject);
    els.deleteProjectButton.addEventListener("click", deleteProject);
    els.newProjectButton.addEventListener("click", () => els.newProjectModal.showModal());
    els.mobileNewProjectButton.addEventListener("click", () => els.newProjectModal.showModal());
    els.newProjectForm.addEventListener("submit", createProject);
    els.financeForm.addEventListener("submit", saveFinanceMovement);
    els.enableWorkAccounts.addEventListener("click", () => {
      state.showWorkAccountsSetup = true;
      renderWorkAccounts();
      refreshIcons();
      setTimeout(() => {
        els.workAccounts.scrollIntoView({ behavior: "smooth", block: "center" });
        els.workAccountTitle.focus({ preventScroll: true });
      }, 120);
    });
    els.workAccountForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!state.draft) return;
      const title = els.workAccountTitle.value.trim();
      if (!title) return;
      state.draft.workAccounts.push({
        id: uuid("account"),
        title,
        status: "in_process",
        pendingAmount: parseMoneyInput(els.workAccountPending.value),
        expectedIncome: 0,
        payableWilington: 0,
        otherEstimatedCost: 0,
        otherCostDetails: "",
        separateWork: false,
        notes: "",
      });
      els.workAccountForm.reset();
      renderDraftLists();
    });
    els.rescheduleForm.addEventListener("submit", saveRescheduledReminder);
    els.closeRescheduleModal.addEventListener("click", () => els.rescheduleModal.close());
    els.cancelRescheduleModal.addEventListener("click", () => els.rescheduleModal.close());
    els.rescheduleModal.addEventListener("click", (event) => {
      if (event.target === els.rescheduleModal) els.rescheduleModal.close();
    });
    els.rescheduleModal.querySelector(".reschedule-presets").addEventListener("click", (event) => {
      const button = event.target.closest("[data-reschedule-days]");
      if (!button) return;
      els.rescheduleDate.value = dateFromToday(button.dataset.rescheduleDays);
      els.rescheduleDate.focus();
    });
    els.workAccountList.addEventListener("input", (event) => {
      const field = event.target.closest("[data-account-field]");
      const card = event.target.closest("[data-work-account-id]");
      if (!field || !card || !state.draft) return;
      const account = state.draft.workAccounts.find((item) => item.id === card.dataset.workAccountId);
      if (!account) return;
      const key = field.dataset.accountField;
      account[key] = key === "separateWork" ? field.checked : ["pendingAmount", "expectedIncome", "payableWilington", "otherEstimatedCost"].includes(key) ? parseMoneyInput(field.value) : field.value;
      els.saveStatus.textContent = "Cambios pendientes de guardar";
      renderProjectFinanceOverview();
      renderProjectHealth();
    });
    els.workAccountList.addEventListener("change", (event) => {
      const field = event.target.closest("[data-account-field]");
      if (!field) return;
      if (["pendingAmount", "expectedIncome", "payableWilington", "otherEstimatedCost"].includes(field.dataset.accountField)) field.value = formatMoneyInput(field.value);
      renderWorkAccounts();
      refreshIcons();
    });
    els.quickCaptureForm.addEventListener("submit", (event) => {
      event.preventDefault();
      prepareQuickCapture(els.quickCaptureInput.value);
    });
    els.quickCaptureMic.addEventListener("click", startQuickDictation);
    els.quickReminderButton.addEventListener("click", () => {
      if (!state.projects.length) return toast("Crea un trabajo antes de agregar alertas");
      openProject(state.projects[0]);
      setTimeout(() => els.reminderTitle.focus(), 200);
    });

    els.taskForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const title = els.taskTitle.value.trim();
      if (!title || !state.draft) return;
      const stage = els.taskStage.value;
      state.draft.tasks.push({ id: uuid("task"), title, dueDate: els.taskDate.value, stage, done: stage === "delivered" });
      els.taskForm.reset();
      renderDraftLists();
    });

    els.reminderForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const title = els.reminderTitle.value.trim();
      if (!title || !state.draft) return;
      state.draft.reminders.push({
        id: uuid("reminder"),
        type: els.reminderType.value,
        title,
        dueDate: els.reminderDate.value,
        amount: Number(els.reminderAmount.value) || 0,
        alertDays: Number(els.reminderAlertDays.value) || 0,
        done: false,
      });
      els.reminderForm.reset();
      els.reminderAlertDays.value = "3";
      renderDraftLists();
    });

    els.evidenceForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!state.draft) return;
      const url = safeExternalUrl(els.evidenceUrl.value);
      if (!url) return toast("Usa un enlace válido que empiece por https://");
      state.draft.evidence.push({
        id: uuid("evidence"),
        type: els.evidenceType.value,
        title: els.evidenceTitle.value.trim(),
        url,
        addedAt: new Date().toISOString(),
      });
      els.evidenceForm.reset();
      renderDraftLists();
    });

    els.projectSearch.addEventListener("input", () => {
      state.search = els.projectSearch.value;
      renderProjects();
      refreshIcons();
    });
    els.statusFilters.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;
      state.filter = button.dataset.filter;
      els.statusFilters.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("is-active", item === button));
      renderProjects();
      refreshIcons();
    });
    els.notificationButton.addEventListener("click", enableNotifications);
    els.financeSearch.addEventListener("input", () => {
      state.financeSearch = els.financeSearch.value;
      state.financeLimit = 60;
      renderFinance();
      refreshIcons();
    });
    els.financeTypeFilter.addEventListener("change", () => {
      state.financeTypeFilter = els.financeTypeFilter.value;
      state.financeLimit = 60;
      renderFinance();
      refreshIcons();
    });
    els.financeProjectFilter.addEventListener("change", () => {
      state.financeProjectFilter = els.financeProjectFilter.value;
      state.financeLimit = 60;
      renderFinance();
      refreshIcons();
    });
    els.financeType.addEventListener("change", () => {
      renderFinanceCategories("");
      refreshIcons();
    });
    els.financeProject.addEventListener("change", () => {
      renderFinanceAccounts(els.financeProject.value);
      refreshIcons();
    });
    els.financeShowMore.addEventListener("click", () => {
      state.financeLimit += 60;
      renderFinance();
      refreshIcons();
    });
    els.viewProjectTransactions.addEventListener("click", showProjectTransactions);
    els.closeFinanceDetail.addEventListener("click", () => {
      state.financeBreakdown = "";
      renderProjectFinanceOverview();
      refreshIcons();
    });
    els.deleteFinanceButton.addEventListener("click", deleteFinanceMovement);
    [els.financeAmount, els.projectContractValue, els.projectNextPayment, els.newContractValue, els.workAccountPending].forEach((input) => {
      input.addEventListener("input", () => keepMoneyFormatted(input));
    });
    els.projectContractValue.addEventListener("input", () => {
      if (!state.draft) return;
      state.draft.contractValue = parseMoneyInput(els.projectContractValue.value);
      renderProjectFinanceOverview();
      refreshIcons();
    });
    els.projectNextPayment.addEventListener("input", () => {
      if (!state.draft) return;
      state.draft.nextPaymentAmount = parseMoneyInput(els.projectNextPayment.value);
      renderProjectFinanceOverview();
      refreshIcons();
    });
    els.projectStatus.addEventListener("change", () => {
      if (!state.draft) return;
      state.draft.status = els.projectStatus.value;
      renderDraftLists();
    });
    els.usePendingPayment.addEventListener("click", () => {
      if (!state.draft) return;
      const finance = projectFinancialSummary(state.draft);
      if (!(finance.pending > 0)) return;
      state.draft.nextPaymentAmount = finance.pending;
      els.projectNextPayment.value = formatMoneyInput(finance.pending);
      renderProjectFinanceOverview();
      els.saveStatus.textContent = "Cobro pendiente listo para guardar";
      refreshIcons();
    });
  }

  function supportsPushNotifications() {
    return "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
  }

  function base64UrlToUint8Array(value) {
    const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
    const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    return Uint8Array.from(raw, (char) => char.charCodeAt(0));
  }

  async function authorizedFetch(url, options = {}) {
    if (!state.user) throw new Error("Inicia sesión para administrar las alertas.");
    const token = await state.user.getIdToken();
    return fetch(url, {
      ...options,
      headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` },
    });
  }

  async function loadPushConfig() {
    if (state.pushServerConfig) return state.pushServerConfig;
    const response = await fetch("/api/operaciones/notificaciones/config", { cache: "no-store" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.enabled || !result.publicKey) {
      throw new Error(result.error || "El servidor de alertas no está disponible.");
    }
    state.pushServerConfig = result;
    return result;
  }

  function pushProject(project) {
    const deadlineReminder = Engine.projectDeadlineReminder(project);
    return {
      projectKey: getProjectKey(project),
      projectName: project.name,
      reminders: [...(project.reminders || []), ...(deadlineReminder ? [deadlineReminder] : [])].map((reminder) => ({
        id: reminder.id,
        type: reminder.type,
        title: reminder.title,
        dueDate: reminder.dueDate,
        amount: Number(reminder.amount) || 0,
        alertDays: Number(reminder.alertDays) || 0,
        done: reminder.done === true,
      })),
    };
  }

  async function syncPushSchedules(projects = state.projects, replace = true) {
    if (!state.user) return;
    const response = await authorizedFetch("/api/operaciones/notificaciones/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ replace, projects: projects.map(pushProject) }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "No se pudo sincronizar la agenda de alertas.");
  }

  async function savePushSubscription(subscription) {
    const response = await authorizedFetch("/api/operaciones/notificaciones/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: subscription.toJSON(), platform: navigator.userAgent }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "No se pudo registrar este teléfono.");
  }

  async function sendPushTest() {
    const response = await authorizedFetch("/api/operaciones/notificaciones/test", { method: "POST" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "No se pudo enviar la prueba.");
  }

  async function enableNotifications() {
    if (!supportsPushNotifications()) return toast("Este navegador no admite notificaciones push");
    els.notificationButton.disabled = true;
    try {
      const config = await loadPushConfig();
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Debes permitir las notificaciones en este dispositivo.");
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlToUint8Array(config.publicKey),
        });
      }
      await savePushSubscription(subscription);
      await syncPushSchedules(state.projects, true);
      await sendPushTest();
      toast("Alertas activadas: funcionan con la app cerrada");
    } catch (error) {
      console.error("No se pudieron activar las alertas push", error);
      toast(error.message || "No se pudieron activar las alertas");
    } finally {
      els.notificationButton.disabled = false;
      updateNotificationButton();
    }
  }

  async function updateNotificationButton() {
    if (!els.notificationButton) return;
    if (!supportsPushNotifications()) {
      els.notificationButton.innerHTML = '<i data-lucide="bell-off"></i><span>Alertas no compatibles</span>';
      return refreshIcons();
    }
    let active = false;
    try {
      const registration = await navigator.serviceWorker.ready;
      active = Notification.permission === "granted" && Boolean(await registration.pushManager.getSubscription());
    } catch (error) {
      active = false;
    }
    els.notificationButton.innerHTML = `<i data-lucide="${active ? "bell-ring" : "bell"}"></i><span>${active ? "Alertas en segundo plano" : "Activar alertas"}</span>`;
    refreshIcons();
  }

  function setSyncStatus(online, message) {
    els.syncPill.classList.toggle("is-offline", !online);
    els.syncPill.innerHTML = `<i data-lucide="${online ? "cloud" : "cloud-off"}"></i><span>${escapeHtml(message)}</span>`;
    refreshIcons();
  }

  function maybeRevealApp() {
    if (!state.financeReady || !state.operationsReady) return;
    syncProjects();
    const pushDigest = JSON.stringify(state.projects.map(pushProject));
    if (pushDigest !== state.lastPushDigest) {
      state.lastPushDigest = pushDigest;
      syncPushSchedules(state.projects, true).catch((error) => {
        state.lastPushDigest = "";
        console.warn("No se actualizó la agenda de notificaciones", error);
      });
    }
    els.loadingScreen.classList.add("is-hidden");
    els.authScreen.classList.add("is-hidden");
    els.appShell.classList.remove("is-hidden");
    setSyncStatus(true, "Portal al día");
  }

  function clearSubscriptions() {
    state.subscriptions.forEach((unsubscribe) => unsubscribe());
    state.subscriptions = [];
  }

  function readFinanceSummaryFromFinance() {
    return new Promise((resolve, reject) => {
      const iframe = document.createElement("iframe");
      iframe.hidden = true;
      iframe.setAttribute("aria-hidden", "true");
      iframe.src = `/finanzas.html?historical-import=${Date.now()}`;
      document.body.appendChild(iframe);
      const startedAt = Date.now();
      const finish = (value, error) => {
        clearInterval(timer);
        iframe.remove();
        if (error) reject(error);
        else resolve(value);
      };
      const timer = setInterval(() => {
        try {
          const documentFrame = iframe.contentDocument;
          const loading = documentFrame && documentFrame.getElementById("data-loading");
          const app = documentFrame && documentFrame.getElementById("main-app");
          const balance = documentFrame && documentFrame.getElementById("cuenta-frank-val");
          const income = documentFrame && documentFrame.getElementById("g-ingresos");
          const expenses = documentFrame && documentFrame.getElementById("g-gastos");
          const profit = documentFrame && documentFrame.getElementById("g-profit");
          const isReady = app && !app.classList.contains("hidden") && (!loading || loading.style.display === "none");
          if (isReady && balance && income && expenses && profit) {
            const parseCurrency = (node) => Number(node.textContent.replace(/[^0-9-]/g, ""));
            const summary = {
              openingBalance: parseCurrency(balance),
              sourceTotalIncome: parseCurrency(income),
              sourceTotalExpenses: parseCurrency(expenses),
              sourceProfitTotal: parseCurrency(profit),
            };
            if (Object.values(summary).every(Number.isFinite)) finish(summary);
          } else if (Date.now() - startedAt > 25000) {
            finish(null, new Error("No fue posible leer el resumen de CBD Finanzas para el corte histórico."));
          }
        } catch (error) {
          if (Date.now() - startedAt > 25000) finish(null, error);
        }
      }, 350);
    });
  }

  async function commitInChunks(entries, size = 350) {
    for (let index = 0; index < entries.length; index += size) {
      const batch = state.db.batch();
      entries.slice(index, index + size).forEach(({ ref, data, merge = true }) => batch.set(ref, data, { merge }));
      await batch.commit();
    }
  }

  async function ensureHistoricalSnapshot() {
    const metaRef = state.db.collection("operaciones_finanzas_meta").doc("frank");
    const current = await metaRef.get();
    const currentMeta = current.exists ? current.data() : {};
    if (currentMeta.snapshotComplete && Number(currentMeta.version) >= 5) {
      state.financeMeta = current.data();
      return;
    }
    const isUpgrade = currentMeta.snapshotComplete && Number(currentMeta.version) >= 2;
    const isCommercialCorrection = currentMeta.snapshotComplete && Number(currentMeta.version) >= 3;
    setSyncStatus(false, "Completando historial financiero");
    const [transactionSnapshot, projectStateSnapshot, financeSummary, existingFinanceSnapshot, existingProjectSnapshot] = await Promise.all([
      state.db.collection("transacciones").get(),
      state.db.collection("config").doc("proyectos_estado").get(),
      isUpgrade ? Promise.resolve({
        openingBalance: Number(currentMeta.openingBalance) || 0,
        sourceTotalIncome: Number(currentMeta.sourceTotalIncome) || 0,
        sourceTotalExpenses: Number(currentMeta.sourceTotalExpenses) || 0,
        sourceProfitTotal: Number(currentMeta.sourceProfitTotal) || 0,
      }) : readFinanceSummaryFromFinance(),
      state.db.collection("operaciones_finanzas_transacciones").get(),
      state.db.collection("operaciones_proyectos").get(),
    ]);
    const sourceTransactions = transactionSnapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
    const projectStates = projectStateSnapshot.exists ? projectStateSnapshot.data() || {} : {};
    const existingFinanceDocs = existingFinanceSnapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
    const existingProjectDocs = existingProjectSnapshot.docs.map((document) => ({ docId: document.id, ...document.data() }));
    const existingBySourceId = new Map(existingFinanceDocs.map((transaction) => [String(transaction.sourceId || ""), transaction]).filter(([sourceId]) => sourceId));
    const existingSourceIds = new Set(existingBySourceId.keys());
    const existingProjectNames = new Set(existingProjectDocs.map((project) => Engine.normalize(project.financeProjectName || project.name)));
    const imported = sourceTransactions.filter(Engine.isBusinessTransaction);
    const activeProjects = Engine.deriveFinanceProjects(sourceTransactions, projectStates);
    const importedAt = firebase.firestore.FieldValue.serverTimestamp();
    const entries = imported.filter((transaction) => !isUpgrade && !existingSourceIds.has(String(transaction.id))).map((transaction) => ({
      ref: state.db.collection("operaciones_finanzas_transacciones").doc(`import_${String(transaction.id).replace(/\//g, "_")}`),
      data: { ...Engine.snapshotTransaction(transaction), sourceId: transaction.id, importedAt },
    }));
    imported.forEach((transaction) => {
      const existing = existingBySourceId.get(String(transaction.id));
      if (!existing || existing.originalCategory) return;
      entries.push({
        ref: state.db.collection("operaciones_finanzas_transacciones").doc(existing.id),
        data: { originalCategory: String(transaction.categoria || (transaction.tipo === "ingreso" ? "Otros Ingresos" : "Otros Gastos")) },
      });
    });
    const projectProfiles = {
      "bote firulays": { contractValue: 3600000, nextPaymentAmount: 1800000 },
      "botes zodiac": { contractValue: 33000000, nextPaymentAmount: 8000000 },
      "yate le merediet": { contractValue: 5400000 },
      "yate haya": { contractValue: 1625000, paidOpening: 0, paidOpeningLedger: 0 },
    };
    activeProjects.forEach((project) => {
      if (Engine.normalize(project.name) === "yate haya") return;
      const normalizedName = Engine.normalize(project.name);
      const profile = projectProfiles[normalizedName] || {};
      const existingProject = existingProjectDocs.find((item) => Engine.normalize(item.financeProjectName || item.name) === normalizedName);
      if (existingProject) {
        const missingProfile = {};
        Object.entries(profile).forEach(([key, value]) => {
          const mustCorrect = isCommercialCorrection && ["bote firulays", "botes zodiac"].includes(normalizedName);
          if (mustCorrect || !(Number(existingProject[key]) > 0)) missingProfile[key] = value;
        });
        if (Object.keys(missingProfile).length) entries.push({
          ref: state.db.collection("operaciones_proyectos").doc(existingProject.docId),
          data: missingProfile,
        });
        return;
      }
      if (isUpgrade) return;
      if (existingProjectNames.has(normalizedName)) return;
      entries.push({
        ref: state.db.collection("operaciones_proyectos").doc(`finance-${Engine.slugify(project.name)}`),
        data: {
          name: project.name,
          financeProjectName: project.name,
          status: "in_process",
          archived: false,
          scope: "",
          tasks: [],
          reminders: [],
          ...profile,
          financeSnapshot: { income: project.income, expenses: project.expenses, balance: project.balance, lastMovement: project.lastMovement },
          importedFromFinanceAt: importedAt,
        },
      });
    });

    const firulays = existingProjectDocs.find((project) => Engine.normalize(project.financeProjectName || project.name) === "bote firulays");
    if (firulays) {
      const firulaysTasks = Array.isArray(firulays.tasks) ? firulays.tasks.map((task) => ({ ...task })) : [];
      [
        { title: "Pulido integral de gelcoat", dueDate: "", stage: "delivered", done: true },
        { title: "Limpieza profesional de cojinería", dueDate: "", stage: "delivered", done: true },
      ].forEach((task) => {
        const existingTask = firulaysTasks.find((item) => Engine.normalize(item.title) === Engine.normalize(task.title));
        if (existingTask) Object.assign(existingTask, { stage: "delivered", done: true });
        else firulaysTasks.push({ id: uuid("task"), ...task });
      });
      const scopeLines = String(firulays.scope || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      const scopeKeys = new Set(scopeLines.map(Engine.normalize));
      ["Pulido integral de gelcoat", "Limpieza profesional de cojinería"].forEach((line) => {
        if (!scopeKeys.has(Engine.normalize(line))) scopeLines.push(line);
      });
      entries.push({
        ref: state.db.collection("operaciones_proyectos").doc(firulays.docId),
        data: { contractValue: 3600000, nextPaymentAmount: 1800000, status: "completed", archived: false, scope: scopeLines.join("\n"), tasks: firulaysTasks, updatedAt: importedAt, updatedBy: state.user.email || state.user.uid },
      });
    }

    const haya = existingProjectDocs.find((project) => Engine.normalize(project.financeProjectName || project.name) === "yate haya");
    const hayaFinance = activeProjects.find((project) => Engine.normalize(project.name) === "yate haya");
    const hayaProfile = projectProfiles["yate haya"];
    const hayaRef = haya
      ? state.db.collection("operaciones_proyectos").doc(haya.docId)
      : state.db.collection("operaciones_proyectos").doc("finance-yate-haya");
    const hayaTasks = Array.isArray(haya && haya.tasks) ? haya.tasks.map((task) => ({ ...task })) : [];
    const hayaTaskTitles = new Set(hayaTasks.map((task) => Engine.normalize(task.title)));
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    [
      { title: "Pasacabos de popa", dueDate: "", stage: "in_progress", done: false },
      { title: "Piso de foam — revisar desprendimiento", dueDate: tomorrow.toISOString().slice(0, 10), stage: "warranty", done: false },
    ].forEach((task) => {
      if (!hayaTaskTitles.has(Engine.normalize(task.title))) hayaTasks.push({ id: uuid("task"), ...task });
    });
    entries.push({
      ref: hayaRef,
      data: {
        name: haya && haya.name ? haya.name : "Yate Haya",
        financeProjectName: haya && haya.financeProjectName ? haya.financeProjectName : "Yate Haya",
        status: haya && haya.status ? haya.status : "in_process",
        archived: false,
        tasks: hayaTasks,
        reminders: Array.isArray(haya && haya.reminders) ? haya.reminders : [],
        contractValue: hayaProfile.contractValue,
        paidOpening: hayaProfile.paidOpening,
        paidOpeningLedger: hayaProfile.paidOpeningLedger,
        financeSnapshot: hayaFinance ? { income: hayaFinance.income, expenses: hayaFinance.expenses, balance: hayaFinance.balance, lastMovement: hayaFinance.lastMovement } : (haya && haya.financeSnapshot) || null,
        updatedAt: importedAt,
        updatedBy: state.user.email || state.user.uid,
      },
    });
    await commitInChunks(entries);
    const sourceCutoff = currentMeta.sourceCutoff || new Date().toISOString().slice(0, 10);
    const meta = {
      snapshotComplete: true,
      owner: "Frank",
      openingBalance: Number.isFinite(Number(currentMeta.openingBalance)) ? Number(currentMeta.openingBalance) : financeSummary.openingBalance,
      sourceTotalIncome: financeSummary.sourceTotalIncome,
      sourceTotalExpenses: financeSummary.sourceTotalExpenses,
      sourceProfitTotal: financeSummary.sourceProfitTotal,
      sourceCutoff,
      sourceCount: isUpgrade ? Number(currentMeta.sourceCount) || sourceTransactions.length : sourceTransactions.length,
      importedCount: isUpgrade ? Number(currentMeta.importedCount) || existingFinanceDocs.length : imported.length,
      projectCount: isUpgrade ? Number(currentMeta.projectCount) || existingProjectDocs.length : activeProjects.length,
      importedAt: currentMeta.importedAt || importedAt,
      importedBy: currentMeta.importedBy || state.user.email || state.user.uid,
      mode: "historical-independent",
      version: 5,
    };
    await metaRef.set(meta, { merge: true });
    state.financeMeta = { ...meta, importedAt: new Date() };
  }

  async function subscribeData() {
    clearSubscriptions();
    state.financeReady = state.operationsReady = false;
    setSyncStatus(false, "Preparando datos");
    try {
      await ensureHistoricalSnapshot();
    } catch (error) {
      console.error("No se pudo crear la copia histórica", error);
      setSyncStatus(false, "Importación pendiente");
      els.loadingScreen.querySelector("p").textContent = "No se pudo completar la copia histórica. Recarga para intentarlo de nuevo.";
      return;
    }
    state.subscriptions.push(
      state.db.collection("operaciones_proyectos").onSnapshot(
        (snapshot) => {
          state.operationDocs = snapshot.docs.map((document) => ({ docId: document.id, ...document.data() }));
          state.operationsReady = true;
          maybeRevealApp();
        },
        (error) => dataError("datos operativos", error),
      ),
    );
    state.subscriptions.push(
      state.db.collection("operaciones_finanzas_transacciones").onSnapshot(
        (snapshot) => {
          state.financeTransactions = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
          state.financeReady = true;
          maybeRevealApp();
        },
        (error) => dataError("mi historial financiero", error),
      ),
    );
  }

  function dataError(source, error) {
    console.error(`No se pudieron cargar ${source}`, error);
    setSyncStatus(false, "Conexión pendiente");
    if (source === "datos operativos") state.operationsReady = true;
    if (source === "mi historial financiero") state.financeReady = true;
    maybeRevealApp();
    toast(`No se pudieron sincronizar ${source}`);
  }

  function handleAuth(user) {
    clearSubscriptions();
    state.user = user;
    state.lastPushDigest = "";
    if (!user) {
      els.loadingScreen.classList.add("is-hidden");
      els.appShell.classList.add("is-hidden");
      els.authScreen.classList.remove("is-hidden");
      return;
    }
    els.loadingScreen.classList.remove("is-hidden");
    els.authScreen.classList.add("is-hidden");
    const email = user.email || "Cuenta CBD";
    els.userName.textContent = email;
    els.userAvatar.textContent = email.slice(0, 2).toUpperCase();
    subscribeData();
  }

  function cacheElements() {
    Object.assign(els, {
      loadingScreen: byId("loading-screen"), authScreen: byId("auth-screen"), appShell: byId("app-shell"),
      loginForm: byId("login-form"), authEmail: byId("auth-email"), authPassword: byId("auth-password"), authError: byId("auth-error"), loginButton: byId("login-button"),
      logoutButton: byId("logout-button"), userName: byId("user-name"), userAvatar: byId("user-avatar"), syncPill: byId("sync-pill"), notificationButton: byId("notification-button"), newProjectButton: byId("new-project-button"), viewTitle: byId("view-title"), todayLabel: byId("today-label"),
      metricsGrid: byId("metrics-grid"), todayControl: byId("today-control"), todayCount: byId("today-count"), quickCaptureForm: byId("quick-capture-form"), quickCaptureInput: byId("quick-capture-input"), quickCaptureMic: byId("quick-capture-mic"), quickCaptureStatus: byId("quick-capture-status"), dashboardProjects: byId("dashboard-projects"), dashboardCompleted: byId("dashboard-completed"), dashboardCompletedPanel: byId("dashboard-completed-panel"), dashboardAgenda: byId("dashboard-agenda"), activeProjects: byId("active-projects"), completedProjects: byId("completed-projects"), activeProjectSection: byId("active-project-section"), completedProjectSection: byId("completed-project-section"), activeProjectCount: byId("active-project-count"), completedProjectCount: byId("completed-project-count"), navProjectCount: byId("nav-project-count"), navAlertCount: byId("nav-alert-count"),
      projectSearch: byId("project-search"), statusFilters: byId("status-filters"), agendaSummary: byId("agenda-summary"), agendaTable: byId("agenda-table"), quickReminderButton: byId("quick-reminder-button"),
      drawerBackdrop: byId("drawer-backdrop"), projectDrawer: byId("project-drawer"), closeDrawerButton: byId("close-drawer-button"), drawerTitle: byId("drawer-title"), drawerSubtitle: byId("drawer-subtitle"), projectDocId: byId("project-doc-id"), projectStatus: byId("project-status"), projectLocation: byId("project-location"), projectResponsible: byId("project-responsible"), projectStart: byId("project-start"), projectDeadline: byId("project-deadline"), projectWarrantyUntil: byId("project-warranty-until"), projectContractValue: byId("project-contract-value"), projectNextPayment: byId("project-next-payment"), usePendingPayment: byId("use-pending-payment"), projectFinanceOverview: byId("project-finance-overview"), projectFinanceDetail: byId("project-finance-detail"), projectFinanceDetailTitle: byId("project-finance-detail-title"), projectFinanceDetailHelp: byId("project-finance-detail-help"), projectFinanceDetailList: byId("project-finance-detail-list"), closeFinanceDetail: byId("close-finance-detail"), projectHealth: byId("project-health"), projectLedger: byId("project-ledger"), projectLedgerCaption: byId("project-ledger-caption"), viewProjectTransactions: byId("view-project-transactions"), projectScope: byId("project-scope"), projectBlocker: byId("project-blocker"), projectNotes: byId("project-notes"),
      workAccounts: byId("work-accounts"), workAccountList: byId("work-account-list"), workAccountForm: byId("work-account-form"), workAccountTitle: byId("work-account-title"), workAccountPending: byId("work-account-pending"), enableWorkAccounts: byId("enable-work-accounts"),
      drawerProgress: byId("drawer-progress"), drawerProgressBar: byId("drawer-progress-bar"), taskList: byId("task-list"), taskForm: byId("task-form"), taskTitle: byId("task-title"), taskDate: byId("task-date"), taskStage: byId("task-stage"), reminderList: byId("reminder-list"), reminderForm: byId("reminder-form"), reminderType: byId("reminder-type"), reminderTitle: byId("reminder-title"), reminderDate: byId("reminder-date"), reminderAmount: byId("reminder-amount"), reminderAlertDays: byId("reminder-alert-days"), evidenceList: byId("evidence-list"), evidenceForm: byId("evidence-form"), evidenceType: byId("evidence-type"), evidenceTitle: byId("evidence-title"), evidenceUrl: byId("evidence-url"), saveStatus: byId("save-status"), saveProjectButton: byId("save-project-button"), deleteProjectButton: byId("delete-project-button"),
      newProjectModal: byId("new-project-modal"), newProjectForm: byId("new-project-form"), newContractValue: byId("new-contract-value"), mobileNewProjectButton: byId("mobile-new-project-button"), toast: byId("toast"),
      financeMetrics: byId("finance-metrics"), financeCutoff: byId("finance-cutoff"), financeTable: byId("finance-table"), financeShowMore: byId("finance-show-more"), financeSearch: byId("finance-search"), financeTypeFilter: byId("finance-type-filter"), financeProjectFilter: byId("finance-project-filter"), financeFilterSummary: byId("finance-filter-summary"),
      financeModal: byId("finance-modal"), financeForm: byId("finance-form"), financeId: byId("finance-id"), financeType: byId("finance-type"), financeAmount: byId("finance-amount"), financeDate: byId("finance-date"), financeTime: byId("finance-time"), financeCategory: byId("finance-category"), financeProject: byId("finance-project"), financeAccountWrap: byId("finance-account-wrap"), financeAccount: byId("finance-account"), financeDescription: byId("finance-description"), financeModalTitle: byId("finance-modal-title"), financeEditNote: byId("finance-edit-note"), saveFinanceButton: byId("save-finance-button"), deleteFinanceButton: byId("delete-finance-button"),
      rescheduleModal: byId("reschedule-modal"), rescheduleForm: byId("reschedule-form"), rescheduleProjectKey: byId("reschedule-project-key"), rescheduleReminderId: byId("reschedule-reminder-id"), rescheduleTitle: byId("reschedule-title"), rescheduleDate: byId("reschedule-date"), closeRescheduleModal: byId("close-reschedule-modal"), cancelRescheduleModal: byId("cancel-reschedule-modal"),
    });
  }

  function init() {
    cacheElements();
    installEventHandlers();
    els.todayLabel.textContent = new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long" }).format(new Date()).toUpperCase();
    firebase.initializeApp(FIREBASE_CONFIG);
    state.auth = firebase.auth();
    state.db = firebase.firestore();
    state.auth.onAuthStateChanged(handleAuth);
    updateNotificationButton();
    refreshIcons();

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js?build=operations-v22", { updateViaCache: "none" }).then(updateNotificationButton).catch(() => {}));
    }
  }

  init();
})();
