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
  const FINANCE_METHODS = [
    { value: "Efectivo", label: "Efectivo", icon: "banknote" },
    { value: "Transferencia", label: "Cuenta", icon: "building-2" },
  ];
  const TASK_STAGES = ["pending", "in_progress", "delivered", "warranty"];
  const TASK_STAGE_LABELS = {
    pending: "Pendiente",
    in_progress: "En proceso",
    delivered: "Entregado",
    warranty: "Garantía",
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
    subscriptions: [],
    toastTimer: null,
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
    return type === "purchase" ? "Compra" : type === "payment" ? "Pago" : "Aviso";
  }

  function reminderIcon(type) {
    return type === "purchase" ? "shopping-bag" : type === "payment" ? "credit-card" : "bell-ring";
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
      progress: Number(project.progress) || 0,
      contractValue: Math.max(0, Number(project.contractValue) || 0),
      nextPaymentAmount: Math.max(0, Number(project.nextPaymentAmount) || 0),
      paidOpening: Math.max(0, Number(project.paidOpening) || 0),
      paidOpeningLedger: Math.max(0, Number(project.paidOpeningLedger) || 0),
      tasks: Array.isArray(project.tasks) ? project.tasks.map((item) => ({ ...item })) : [],
      reminders: Array.isArray(project.reminders) ? project.reminders.map((item) => ({ ...item })) : [],
      docId: project.docId || "",
      finance: project.finance || null,
    };
  }

  function syncProjects() {
    state.projects = Engine.mergeProjects([], state.operationDocs).map(defaultProject);
    renderEverything();
    if ("Notification" in window && Notification.permission === "granted") sendDueNotifications();
  }

  function allReminders(includeDone = true) {
    return state.projects
      .flatMap((project) =>
        (project.reminders || []).map((reminder) => ({
          ...reminder,
          projectName: project.name,
          projectKey: getProjectKey(project),
          project,
        })),
      )
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

  function displayPending(value) {
    return value === null ? "Por definir" : formatMoney(value);
  }

  function metricCard(label, value, detail, icon, alert = false) {
    return `<article class="metric-card${alert ? " is-alert" : ""}"><div class="metric-top"><span>${escapeHtml(label)}</span><span class="metric-icon"><i data-lucide="${icon}"></i></span></div><strong>${escapeHtml(value)}</strong><small>${escapeHtml(detail)}</small></article>`;
  }

  function renderMetrics() {
    const active = state.projects.filter((project) => project.status !== "completed");
    const completed = state.projects.filter((project) => project.status === "completed");
    const attention = active.filter((project) => Engine.urgencyFor(project) !== "on-track").length;
    const receivable = state.projects.reduce((total, project) => {
      const pending = projectFinancialSummary(project).pending;
      return total + (pending === null ? 0 : pending);
    }, 0);
    els.metricsGrid.innerHTML = [
      metricCard("Trabajos activos", active.length, `${openTasks({ tasks: active.flatMap((item) => item.tasks || []) }).length} tareas por completar`, "ship"),
      metricCard("Por cobrar", formatMoney(receivable), "Saldo pendiente entre todos los trabajos", "circle-dollar-sign", receivable > 0),
      metricCard("Requieren atención", attention, attention ? "Fechas o pendientes vencidos" : "La operación está al día", "triangle-alert", attention > 0),
      metricCard("Completados", completed.length, completed.length ? "Siguen visibles para cobros y garantías" : "Aún no hay trabajos cerrados", "badge-check"),
    ].join("");
  }

  function projectCard(project) {
    const isCompleted = project.status === "completed";
    const urgency = isCompleted ? "completed" : Engine.urgencyFor(project);
    const progress = projectProgress(project);
    const pending = openTasks(project).length;
    const scope = project.scope || "Alcance pendiente de definir. Abre la ficha para organizar entregables y tareas.";
    const finance = projectFinancialSummary(project);
    const deadlineClass = urgency === "late" ? "is-late" : urgency === "attention" ? "is-attention" : "";
    const statusLabel = isCompleted ? "Completado" : project.status === "paused" ? "Pausado" : urgencyLabel(urgency);
    const collectionBanner = isCompleted && finance.pending > 0
      ? `<div class="collection-banner"><span><i data-lucide="circle-dollar-sign"></i>Trabajo terminado · falta cobrar</span><strong>${escapeHtml(formatMoney(finance.pending))}</strong></div>`
      : isCompleted
        ? `<div class="collection-banner is-paid"><span><i data-lucide="badge-check"></i>Trabajo terminado y pagado</span><strong>Cerrado</strong></div>`
        : "";
    const footerStatus = isCompleted
      ? (finance.pending > 0 ? "Cobro pendiente" : "Cuenta cerrada")
      : relativeDate(project.deadline);
    return `<article class="project-card" data-project-key="${escapeHtml(getProjectKey(project))}" data-urgency="${urgency}" data-status="${escapeHtml(project.status)}" tabindex="0" role="button" aria-label="Abrir ${escapeHtml(project.name)}">
      <div class="project-card-head"><div><h3>${escapeHtml(project.name)}</h3><p class="location">${escapeHtml(project.location || "Ubicación por definir")}</p></div><span class="status-badge">${escapeHtml(statusLabel)}</span></div>
      <p class="project-scope">${escapeHtml(scope)}</p>
      ${collectionBanner}
      <div class="project-money-grid"><div><span>Pagado</span><strong>${escapeHtml(formatMoney(finance.paid))}</strong></div><div><span>Por cobrar</span><strong class="${finance.pending > 0 ? "is-pending" : ""}">${escapeHtml(displayPending(finance.pending))}</strong></div><div><span>Saldo en proyecto</span><strong>${escapeHtml(formatMoney(finance.balance))}</strong></div></div>
      ${finance.nextPaymentAmount ? `<div class="project-next-payment"><span>Próximo cobro</span><strong>${escapeHtml(formatMoney(finance.nextPaymentAmount))}</strong><small>${isCompleted ? "Cobro pendiente del trabajo terminado" : "Pago registrado para la siguiente fase"}</small></div>` : ""}
      <div class="progress-row"><span>Avance</span><b>${progress}%</b></div><div class="progress-track"><span style="width:${progress}%"></span></div>
      <div class="project-card-foot"><span><i data-lucide="list-checks"></i>${pending ? `${pending} frente${pending === 1 ? "" : "s"} pendiente${pending === 1 ? "" : "s"}` : "Checklist cerrado"}</span><span class="deadline ${deadlineClass}"><i data-lucide="${isCompleted ? "wallet-cards" : "clock-3"}"></i>${escapeHtml(footerStatus)}</span></div>
    </article>`;
  }

  function renderProjectFinanceOverview() {
    if (!state.draft || !els.projectFinanceOverview) return;
    const finance = projectFinancialSummary(state.draft);
    const items = [
      ["Valor contratado", finance.contractValue ? formatMoney(finance.contractValue) : "Por definir", "file-text"],
      ["Pagado", formatMoney(finance.paid), "check"],
      ["Por cobrar", displayPending(finance.pending), "clock-3"],
      ["Gastos registrados", formatMoney(finance.expenses), "receipt-text"],
      ["Saldo en el proyecto", formatMoney(finance.balance), "wallet"],
      ["Tu 50% potencial", formatMoney(finance.frankPotential), "chart-no-axes-combined"],
    ];
    if (finance.nextPaymentAmount) items.splice(3, 0, ["Próximo cobro", formatMoney(finance.nextPaymentAmount), "circle-dollar-sign"]);
    els.projectFinanceOverview.innerHTML = items.map(([label, value, icon]) => `<article><span>${escapeHtml(label)}<i data-lucide="${icon}"></i></span><strong>${escapeHtml(value)}</strong></article>`).join("");
    if (els.usePendingPayment) {
      els.usePendingPayment.disabled = !(finance.pending > 0);
      els.usePendingPayment.textContent = finance.pending > 0 ? `Usar ${formatMoney(finance.pending)}` : "Sin saldo pendiente";
    }
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
        || (state.filter === "receivable" && finance.pending > 0)
        || (state.filter === "attention" && !isCompleted && urgency !== "on-track");
      const haystack = Engine.normalize(`${project.name} ${project.scope} ${project.location}`);
      return matchesFilter && (!query || haystack.includes(query));
    });
  }

  function renderProjects() {
    const empty = `<div class="empty-state"><i data-lucide="ship-wheel"></i><strong>No hay trabajos en esta vista</strong><span>Prueba otro filtro o crea un trabajo nuevo.</span></div>`;
    const active = state.projects.filter((project) => project.status !== "completed");
    const completed = state.projects.filter((project) => project.status === "completed").sort((a, b) => {
      const pendingA = projectFinancialSummary(a).pending || 0;
      const pendingB = projectFinancialSummary(b).pending || 0;
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
    return `<article class="agenda-item"><span class="agenda-symbol" data-type="${escapeHtml(reminder.type)}"><i data-lucide="${reminderIcon(reminder.type)}"></i></span><div><h3>${escapeHtml(reminder.title)}</h3><p>${escapeHtml(reminder.projectName)}${escapeHtml(amount)}</p></div><span class="agenda-date ${dateClass}">${escapeHtml(formatDate(reminder.dueDate))}</span></article>`;
  }

  function renderDashboardAgenda() {
    const reminders = allReminders(false).slice(0, 6);
    els.dashboardAgenda.innerHTML = reminders.length
      ? reminders.map(agendaItem).join("")
      : `<div class="empty-state"><i data-lucide="bell-ring"></i><strong>Sin alertas pendientes</strong><span>Agrega compras, pagos o avisos desde la ficha de cada trabajo.</span></div>`;
  }

  function agendaRow(reminder) {
    const days = Engine.daysUntil(reminder.dueDate);
    const dateClass = days !== null && days < 0 ? "is-late" : "";
    return `<article class="agenda-row${reminder.done ? " is-done" : ""}" data-project-key="${escapeHtml(reminder.projectKey)}" data-reminder-id="${escapeHtml(reminder.id)}">
      <button class="check-button${reminder.done ? " is-done" : ""}" data-action="toggle-agenda" aria-label="${reminder.done ? "Reabrir" : "Completar"} recordatorio"><i data-lucide="check"></i></button>
      <div><h3>${escapeHtml(reminder.title)}</h3><p>${escapeHtml(reminderTypeLabel(reminder.type))}</p></div>
      <div class="agenda-owner"><h3>${escapeHtml(reminder.projectName)}</h3><p>Trabajo asociado</p></div>
      <span class="agenda-date ${dateClass}">${escapeHtml(formatDate(reminder.dueDate))}</span>
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
      : `<div class="empty-state"><i data-lucide="calendar-plus"></i><strong>La agenda está limpia</strong><span>Crea recordatorios desde cualquier trabajo para verlos aquí.</span></div>`;
    els.navAlertCount.textContent = pending.length;
  }

  function filteredFinanceTransactions() {
    const query = Engine.normalize(state.financeSearch);
    return state.financeTransactions
      .filter((transaction) => {
        const typeMatches = state.financeTypeFilter === "all" || transaction.tipo === state.financeTypeFilter;
        const haystack = Engine.normalize(`${transaction.descripcion} ${transaction.categoria} ${transaction.proyecto} ${transaction.medio}`);
        return typeMatches && (!query || haystack.includes(query));
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
      <div class="finance-row-project">${escapeHtml(transaction.proyecto || "Sin proyecto")}</div>
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
      <div class="project-ledger-main"><strong>${escapeHtml(description)}</strong><span>${escapeHtml(transaction.categoria || "Sin categoría")} · ${escapeHtml(transaction.medio || "Sin medio")} · ${source}</span></div>
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
      financeMetric("Profit de Frank (50%)", totals.frankProfit, "Tu mitad del profit realizado; los retiros no son gasto", "chart-no-axes-combined"),
    ].join("");
    const cutoff = state.financeMeta && state.financeMeta.sourceCutoff;
    els.financeCutoff.textContent = cutoff
      ? `Datos históricos cargados el ${formatDate(cutoff, { long: true })}.`
      : "Datos históricos cargados en este portal.";
    const transactions = filteredFinanceTransactions();
    els.financeTable.innerHTML = transactions.length
      ? transactions.map(financeRow).join("")
      : `<div class="empty-state"><i data-lucide="receipt-text"></i><strong>No hay movimientos para este filtro</strong><span>Registra un ingreso o gasto para comenzar.</span></div>`;
  }

  function setFinanceMethod(value) {
    els.financeMethod.value = value || "";
    els.financeMethodOptions.querySelectorAll("[data-choice-value]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.choiceValue === els.financeMethod.value);
    });
  }

  function renderFinanceCategories(selected) {
    const values = [...(FINANCE_CATEGORIES[els.financeType.value] || [])];
    if (selected && !values.includes(selected)) values.unshift(selected);
    els.financeCategory.innerHTML = values.map((category) =>
      `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`,
    ).join("");
    els.financeCategory.value = selected || values[0] || "";
  }

  function renderFinanceMethods(selected) {
    const values = FINANCE_METHODS.slice();
    if (selected && !values.some((method) => method.value === selected)) values.unshift({ value: selected, label: selected, icon: "circle-dollar-sign" });
    els.financeMethodOptions.innerHTML = values.map((method) =>
      `<button type="button" class="choice-button" data-choice-value="${escapeHtml(method.value)}"><i data-lucide="${method.icon}"></i>${escapeHtml(method.label)}</button>`,
    ).join("");
    setFinanceMethod(selected || "Efectivo");
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

  function openFinanceModal(type, transaction, projectName = "") {
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
    renderFinanceCategories(record.categoria || "");
    renderFinanceMethods(record.medio || (record.id ? "" : "Efectivo"));
    renderFinanceProjects(record.proyecto || projectName || "");
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
      medio: els.financeMethod.value.trim(),
      proyecto: els.financeProject.value.trim(),
      descripcion: els.financeDescription.value.trim(),
      owner: existing ? existing.owner || "Empresa" : "Frank",
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: state.user.email || state.user.uid,
    };
    if (!payload.monto || !payload.fecha || !payload.categoria || !payload.medio) {
      toast("Completa valor, fecha, categoría y medio");
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

  function renderEverything() {
    renderMetrics();
    renderProjects();
    renderDashboardAgenda();
    renderAgenda();
    renderFinance();
    renderProjectLedger();
    refreshIcons();
  }

  function showView(view) {
    state.currentView = view;
    document.querySelectorAll(".view").forEach((node) => node.classList.toggle("is-active", node.id === `view-${view}`));
    document.querySelectorAll("[data-view]").forEach((node) => node.classList.toggle("is-active", node.dataset.view === view));
    els.viewTitle.textContent = view === "dashboard" ? "Centro de operaciones" : view === "projects" ? "Trabajos y cobros" : view === "finance" ? "Mis finanzas" : "Agenda operativa";
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
    const finance = projectFinancialSummary(project);
    els.drawerTitle.textContent = project.name;
    els.drawerSubtitle.textContent = project.status === "completed"
      ? (finance.pending > 0 ? `Trabajo completado · falta cobrar ${formatMoney(finance.pending)}` : "Trabajo completado y pagado")
      : "Control operativo del trabajo";
    els.projectDocId.value = project.docId || "";
    els.projectStatus.value = state.draft.status;
    els.projectLocation.value = state.draft.location;
    els.projectStart.value = state.draft.startDate;
    els.projectDeadline.value = state.draft.deadline;
    els.projectContractValue.value = formatMoneyInput(state.draft.contractValue);
    els.projectNextPayment.value = formatMoneyInput(state.draft.nextPaymentAmount);
    els.projectScope.value = state.draft.scope;
    els.projectNotes.value = state.draft.notes;
    renderDraftLists();
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
  }

  function taskItem(task) {
    const stage = TASK_STAGES.includes(task.stage) ? task.stage : task.done ? "delivered" : "pending";
    const meta = task.dueDate ? formatDate(task.dueDate) : "Sin fecha";
    return `<article class="editable-item${task.done ? " is-done" : ""}" data-task-id="${escapeHtml(task.id)}"><button type="button" class="check-button${task.done ? " is-done" : ""}" data-action="toggle-task" aria-label="${task.done ? "Reabrir" : "Completar"} frente"><i data-lucide="check"></i></button><div><p class="item-title">${escapeHtml(task.title)}</p><p class="item-meta">${escapeHtml(meta)}</p></div><button type="button" class="mini-badge stage-badge" data-stage="${stage}" data-action="cycle-task-stage" aria-label="Cambiar estado del frente">${TASK_STAGE_LABELS[stage]}</button><button type="button" class="delete-button" data-action="delete-task" aria-label="Eliminar frente"><i data-lucide="trash-2"></i></button></article>`;
  }

  function reminderItem(reminder) {
    const meta = `${formatDate(reminder.dueDate)}${reminder.amount ? ` · ${formatMoney(reminder.amount)}` : ""} · aviso ${Number(reminder.alertDays) || 0} día(s) antes`;
    return `<article class="editable-item${reminder.done ? " is-done" : ""}" data-reminder-id="${escapeHtml(reminder.id)}"><button type="button" class="check-button${reminder.done ? " is-done" : ""}" data-action="toggle-reminder" aria-label="${reminder.done ? "Reabrir" : "Completar"} alerta"><i data-lucide="check"></i></button><div><p class="item-title">${escapeHtml(reminder.title)}</p><p class="item-meta">${escapeHtml(meta)}</p></div><span class="mini-badge" data-type="${escapeHtml(reminder.type)}">${reminderTypeLabel(reminder.type)}</span><button type="button" class="delete-button" data-action="delete-reminder" aria-label="Eliminar alerta"><i data-lucide="trash-2"></i></button></article>`;
  }

  function renderDraftLists() {
    if (!state.draft) return;
    const tasks = state.draft.tasks || [];
    const reminders = state.draft.reminders || [];
    const progress = projectProgress(state.draft);
    els.taskList.innerHTML = tasks.length ? tasks.map(taskItem).join("") : `<div class="empty-state"><strong>Sin tareas todavía</strong><span>Divide el alcance en etapas claras para medir el avance.</span></div>`;
    els.reminderList.innerHTML = reminders.length ? reminders.map(reminderItem).join("") : `<div class="empty-state"><strong>Sin alertas todavía</strong><span>Registra aquí compras, pagos o decisiones con fecha.</span></div>`;
    els.drawerProgress.textContent = `${progress}%`;
    els.drawerProgressBar.style.width = `${progress}%`;
    els.saveStatus.textContent = "Cambios pendientes de guardar";
    renderProjectFinanceOverview();
    renderProjectLedger();
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
      startDate: els.projectStart.value,
      deadline: els.projectDeadline.value,
      contractValue: parseMoneyInput(els.projectContractValue.value),
      nextPaymentAmount: parseMoneyInput(els.projectNextPayment.value),
      scope,
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
      startDate: state.draft.startDate,
      deadline: state.draft.deadline,
      contractValue: state.draft.contractValue,
      nextPaymentAmount: state.draft.nextPaymentAmount,
      paidOpening: state.draft.paidOpening,
      paidOpeningLedger: state.draft.paidOpeningLedger,
      scope: state.draft.scope,
      notes: state.draft.notes,
      progress: state.draft.progress,
      tasks: state.draft.tasks,
      reminders: state.draft.reminders,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: state.user.email || state.user.uid,
    };
    els.saveProjectButton.disabled = true;
    els.saveStatus.textContent = "Guardando en Firebase…";
    try {
      await state.db.collection("operaciones_proyectos").doc(id).set(payload, { merge: true });
      els.saveStatus.textContent = "Guardado y sincronizado";
      toast("Trabajo actualizado");
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
    const id = `custom-${Engine.slugify(name)}-${Date.now().toString(36)}`;
    const scope = byId("new-scope").value.trim();
    const tasks = scope.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((title) => ({
      id: uuid("task"), title, dueDate: "", stage: "pending", done: false,
    }));
    const payload = {
      name,
      financeProjectName: "",
      status: "in_process",
      location: byId("new-location").value.trim(),
      deadline: byId("new-deadline").value,
      contractValue: parseMoneyInput(els.newContractValue.value),
      startDate: new Date().toISOString().slice(0, 10),
      scope,
      notes: "",
      progress: 0,
      tasks,
      reminders: [],
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: state.user.email || state.user.uid,
    };
    try {
      await state.db.collection("operaciones_proyectos").doc(id).set(payload);
      els.newProjectModal.close();
      els.newProjectForm.reset();
      toast("Trabajo creado");
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

  function installEventHandlers() {
    document.addEventListener("click", (event) => {
      const viewButton = event.target.closest("[data-view]");
      if (viewButton) showView(viewButton.dataset.view);

      const card = event.target.closest(".project-card");
      if (card) openProject(findProject(card.dataset.projectKey));

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

      const action = event.target.closest("[data-action]");
      if (!action) return;
      const taskNode = action.closest("[data-task-id]");
      const reminderNode = action.closest("[data-reminder-id]");
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
    els.newProjectForm.addEventListener("submit", createProject);
    els.financeForm.addEventListener("submit", saveFinanceMovement);
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
      if (!title || !els.reminderDate.value || !state.draft) return;
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
      renderFinance();
      refreshIcons();
    });
    els.financeTypeFilter.addEventListener("change", () => {
      state.financeTypeFilter = els.financeTypeFilter.value;
      renderFinance();
      refreshIcons();
    });
    els.financeType.addEventListener("change", () => {
      renderFinanceCategories("");
      refreshIcons();
    });
    els.financeMethodOptions.addEventListener("click", (event) => {
      const button = event.target.closest("[data-choice-value]");
      if (button) setFinanceMethod(button.dataset.choiceValue);
    });
    [els.financeAmount, els.projectContractValue, els.projectNextPayment, els.newContractValue].forEach((input) => {
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

  async function enableNotifications() {
    if (!("Notification" in window)) return toast("Este navegador no admite notificaciones");
    const permission = await Notification.requestPermission();
    updateNotificationButton();
    if (permission === "granted") {
      toast("Alertas activadas en este dispositivo");
      sendDueNotifications(true);
    } else {
      toast("Las alertas siguen desactivadas");
    }
  }

  function updateNotificationButton() {
    if (!("Notification" in window)) return;
    const active = Notification.permission === "granted";
    els.notificationButton.innerHTML = `<i data-lucide="${active ? "bell-ring" : "bell"}"></i><span>${active ? "Alertas activas" : "Activar alertas"}</span>`;
    refreshIcons();
  }

  async function showSystemNotification(title, body, tag) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        icon: "/images/operations-icon.svg?v=1",
        badge: "/images/operations-icon.svg?v=1",
        tag,
        data: { url: "/operaciones.html" },
      });
    } catch (error) {
      new Notification(title, { body, icon: "/images/operations-icon.svg?v=1", tag });
    }
  }

  function sendDueNotifications(force = false) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const sent = JSON.parse(localStorage.getItem("cbd_operations_notifications") || "{}");
    const today = new Date().toISOString().slice(0, 10);
    allReminders(false).forEach((reminder) => {
      const days = Engine.daysUntil(reminder.dueDate);
      const alertDays = Number(reminder.alertDays) || 0;
      if (days === null || days > alertDays) return;
      const key = `${reminder.projectKey}:${reminder.id}:${today}`;
      if (!force && sent[key]) return;
      showSystemNotification(
        `${reminderTypeLabel(reminder.type)} · ${reminder.projectName}`,
        `${reminder.title} — ${relativeDate(reminder.dueDate)}`,
        `cbd-${reminder.projectKey}-${reminder.id}`,
      );
      sent[key] = Date.now();
    });
    const entries = Object.entries(sent).sort((a, b) => b[1] - a[1]).slice(0, 120);
    localStorage.setItem("cbd_operations_notifications", JSON.stringify(Object.fromEntries(entries)));
  }

  function setSyncStatus(online, message) {
    els.syncPill.classList.toggle("is-offline", !online);
    els.syncPill.innerHTML = `<i data-lucide="${online ? "cloud" : "cloud-off"}"></i><span>${escapeHtml(message)}</span>`;
    refreshIcons();
  }

  function maybeRevealApp() {
    if (!state.financeReady || !state.operationsReady) return;
    syncProjects();
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
      metricsGrid: byId("metrics-grid"), dashboardProjects: byId("dashboard-projects"), dashboardCompleted: byId("dashboard-completed"), dashboardCompletedPanel: byId("dashboard-completed-panel"), dashboardAgenda: byId("dashboard-agenda"), activeProjects: byId("active-projects"), completedProjects: byId("completed-projects"), activeProjectSection: byId("active-project-section"), completedProjectSection: byId("completed-project-section"), activeProjectCount: byId("active-project-count"), completedProjectCount: byId("completed-project-count"), navProjectCount: byId("nav-project-count"), navAlertCount: byId("nav-alert-count"),
      projectSearch: byId("project-search"), statusFilters: byId("status-filters"), agendaSummary: byId("agenda-summary"), agendaTable: byId("agenda-table"), quickReminderButton: byId("quick-reminder-button"),
      drawerBackdrop: byId("drawer-backdrop"), projectDrawer: byId("project-drawer"), closeDrawerButton: byId("close-drawer-button"), drawerTitle: byId("drawer-title"), drawerSubtitle: byId("drawer-subtitle"), projectDocId: byId("project-doc-id"), projectStatus: byId("project-status"), projectLocation: byId("project-location"), projectStart: byId("project-start"), projectDeadline: byId("project-deadline"), projectContractValue: byId("project-contract-value"), projectNextPayment: byId("project-next-payment"), usePendingPayment: byId("use-pending-payment"), projectFinanceOverview: byId("project-finance-overview"), projectLedger: byId("project-ledger"), projectLedgerCaption: byId("project-ledger-caption"), projectScope: byId("project-scope"), projectNotes: byId("project-notes"),
      drawerProgress: byId("drawer-progress"), drawerProgressBar: byId("drawer-progress-bar"), taskList: byId("task-list"), taskForm: byId("task-form"), taskTitle: byId("task-title"), taskDate: byId("task-date"), taskStage: byId("task-stage"), reminderList: byId("reminder-list"), reminderForm: byId("reminder-form"), reminderType: byId("reminder-type"), reminderTitle: byId("reminder-title"), reminderDate: byId("reminder-date"), reminderAmount: byId("reminder-amount"), reminderAlertDays: byId("reminder-alert-days"), saveStatus: byId("save-status"), saveProjectButton: byId("save-project-button"), deleteProjectButton: byId("delete-project-button"),
      newProjectModal: byId("new-project-modal"), newProjectForm: byId("new-project-form"), newContractValue: byId("new-contract-value"), toast: byId("toast"),
      financeMetrics: byId("finance-metrics"), financeCutoff: byId("finance-cutoff"), financeTable: byId("finance-table"), financeSearch: byId("finance-search"), financeTypeFilter: byId("finance-type-filter"),
      financeModal: byId("finance-modal"), financeForm: byId("finance-form"), financeId: byId("finance-id"), financeType: byId("finance-type"), financeAmount: byId("finance-amount"), financeDate: byId("finance-date"), financeTime: byId("finance-time"), financeCategory: byId("finance-category"), financeMethod: byId("finance-method"), financeMethodOptions: byId("finance-method-options"), financeProject: byId("finance-project"), financeDescription: byId("finance-description"), financeModalTitle: byId("finance-modal-title"), financeEditNote: byId("finance-edit-note"), saveFinanceButton: byId("save-finance-button"),
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
      window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js?build=operations-v13", { updateViaCache: "none" }).catch(() => {}));
    }
  }

  init();
})();
