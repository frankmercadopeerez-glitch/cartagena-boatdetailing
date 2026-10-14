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

  const els = {};
  const state = {
    auth: null,
    db: null,
    user: null,
    transactions: [],
    projectStates: {},
    operationDocs: [],
    projects: [],
    financeReady: false,
    statusReady: false,
    operationsReady: false,
    currentView: "dashboard",
    selectedProject: null,
    draft: null,
    filter: "all",
    search: "",
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
      tasks: Array.isArray(project.tasks) ? project.tasks.map((item) => ({ ...item })) : [],
      reminders: Array.isArray(project.reminders) ? project.reminders.map((item) => ({ ...item })) : [],
      docId: project.docId || "",
      finance: project.finance || null,
    };
  }

  function syncProjects() {
    const financeProjects = Engine.deriveFinanceProjects(state.transactions, state.projectStates);
    state.projects = Engine.mergeProjects(financeProjects, state.operationDocs).map(defaultProject);
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
    return Engine.taskProgress(project.tasks, project.progress);
  }

  function metricCard(label, value, detail, icon, alert = false) {
    return `<article class="metric-card${alert ? " is-alert" : ""}"><div class="metric-top"><span>${escapeHtml(label)}</span><span class="metric-icon"><i data-lucide="${icon}"></i></span></div><strong>${escapeHtml(value)}</strong><small>${escapeHtml(detail)}</small></article>`;
  }

  function renderMetrics() {
    const projects = state.projects;
    const attention = projects.filter((project) => Engine.urgencyFor(project) !== "on-track").length;
    const dated = projects.filter((project) => project.deadline).sort((a, b) => a.deadline.localeCompare(b.deadline));
    const next = dated[0];
    const average = projects.length
      ? Math.round(projects.reduce((total, project) => total + projectProgress(project), 0) / projects.length)
      : 0;
    els.metricsGrid.innerHTML = [
      metricCard("Trabajos activos", projects.length, `${openTasks({ tasks: projects.flatMap((item) => item.tasks || []) }).length} tareas por completar`, "ship"),
      metricCard("Requieren atención", attention, attention ? "Fechas o pendientes vencidos" : "La operación está al día", "triangle-alert", attention > 0),
      metricCard("Próxima entrega", next ? formatDate(next.deadline, { long: true }) : "Por definir", next ? next.name : "Asigna fechas límite", "calendar-check"),
      metricCard("Avance global", `${average}%`, projects.length ? "Promedio de trabajos activos" : "Sin trabajos activos", "gauge"),
    ].join("");
  }

  function projectCard(project) {
    const urgency = Engine.urgencyFor(project);
    const progress = projectProgress(project);
    const pending = openTasks(project).length;
    const scope = project.scope || "Alcance pendiente de definir. Abre la ficha para organizar entregables y tareas.";
    const deadlineClass = urgency === "late" ? "is-late" : urgency === "attention" ? "is-attention" : "";
    return `<article class="project-card" data-project-key="${escapeHtml(getProjectKey(project))}" data-urgency="${urgency}" tabindex="0" role="button" aria-label="Abrir ${escapeHtml(project.name)}">
      <div class="project-card-head"><div><h3>${escapeHtml(project.name)}</h3><p class="location">${escapeHtml(project.location || "Ubicación por definir")}</p></div><span class="status-badge">${urgencyLabel(urgency)}</span></div>
      <p class="project-scope">${escapeHtml(scope)}</p>
      <div class="progress-row"><span>Avance</span><b>${progress}%</b></div><div class="progress-track"><span style="width:${progress}%"></span></div>
      <div class="project-card-foot"><span><i data-lucide="list-checks"></i>${pending ? `${pending} pendiente${pending === 1 ? "" : "s"}` : "Sin pendientes"}</span><span class="deadline ${deadlineClass}"><i data-lucide="clock-3"></i>${escapeHtml(relativeDate(project.deadline))}</span></div>
    </article>`;
  }

  function filteredProjects() {
    const query = Engine.normalize(state.search);
    return state.projects.filter((project) => {
      const matchesFilter = state.filter === "all" || Engine.urgencyFor(project) === state.filter;
      const haystack = Engine.normalize(`${project.name} ${project.scope} ${project.location}`);
      return matchesFilter && (!query || haystack.includes(query));
    });
  }

  function renderProjects() {
    const empty = `<div class="empty-state"><i data-lucide="ship-wheel"></i><strong>No hay trabajos en esta vista</strong><span>Prueba otro filtro o crea un trabajo nuevo.</span></div>`;
    els.dashboardProjects.innerHTML = state.projects.length ? state.projects.slice(0, 4).map(projectCard).join("") : empty;
    const filtered = filteredProjects();
    els.allProjects.innerHTML = filtered.length ? filtered.map(projectCard).join("") : empty;
    els.navProjectCount.textContent = state.projects.length;
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
      : `<div class="empty-state"><i data-lucide="bell-check"></i><strong>Sin alertas pendientes</strong><span>Agrega compras, pagos o avisos desde la ficha de cada trabajo.</span></div>`;
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

  function renderEverything() {
    renderMetrics();
    renderProjects();
    renderDashboardAgenda();
    renderAgenda();
    refreshIcons();
  }

  function showView(view) {
    state.currentView = view;
    document.querySelectorAll(".view").forEach((node) => node.classList.toggle("is-active", node.id === `view-${view}`));
    document.querySelectorAll("[data-view]").forEach((node) => node.classList.toggle("is-active", node.dataset.view === view));
    els.viewTitle.textContent = view === "dashboard" ? "Centro de operaciones" : view === "projects" ? "Embarcaciones en proceso" : "Agenda operativa";
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
    els.drawerTitle.textContent = project.name;
    els.drawerSubtitle.textContent = project.finance ? "Sincronizado con CBD Finanzas" : "Trabajo registrado en Operaciones";
    els.projectDocId.value = project.docId || "";
    els.projectStatus.value = state.draft.status;
    els.projectLocation.value = state.draft.location;
    els.projectStart.value = state.draft.startDate;
    els.projectDeadline.value = state.draft.deadline;
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
    const meta = [task.dueDate ? formatDate(task.dueDate) : "Sin fecha", task.priority === "high" ? "Prioridad alta" : "Prioridad normal"].join(" · ");
    return `<article class="editable-item${task.done ? " is-done" : ""}" data-task-id="${escapeHtml(task.id)}"><button type="button" class="check-button${task.done ? " is-done" : ""}" data-action="toggle-task" aria-label="${task.done ? "Reabrir" : "Completar"} tarea"><i data-lucide="check"></i></button><div><p class="item-title">${escapeHtml(task.title)}</p><p class="item-meta">${escapeHtml(meta)}</p></div><span class="mini-badge">${task.priority === "high" ? "Alta" : "Tarea"}</span><button type="button" class="delete-button" data-action="delete-task" aria-label="Eliminar tarea"><i data-lucide="trash-2"></i></button></article>`;
  }

  function reminderItem(reminder) {
    const meta = `${formatDate(reminder.dueDate)}${reminder.amount ? ` · ${formatMoney(reminder.amount)}` : ""} · aviso ${Number(reminder.alertDays) || 0} día(s) antes`;
    return `<article class="editable-item${reminder.done ? " is-done" : ""}" data-reminder-id="${escapeHtml(reminder.id)}"><button type="button" class="check-button${reminder.done ? " is-done" : ""}" data-action="toggle-reminder" aria-label="${reminder.done ? "Reabrir" : "Completar"} alerta"><i data-lucide="check"></i></button><div><p class="item-title">${escapeHtml(reminder.title)}</p><p class="item-meta">${escapeHtml(meta)}</p></div><span class="mini-badge" data-type="${escapeHtml(reminder.type)}">${reminderTypeLabel(reminder.type)}</span><button type="button" class="delete-button" data-action="delete-reminder" aria-label="Eliminar alerta"><i data-lucide="trash-2"></i></button></article>`;
  }

  function renderDraftLists() {
    if (!state.draft) return;
    const tasks = state.draft.tasks || [];
    const reminders = state.draft.reminders || [];
    const progress = Engine.taskProgress(tasks, state.draft.progress);
    els.taskList.innerHTML = tasks.length ? tasks.map(taskItem).join("") : `<div class="empty-state"><strong>Sin tareas todavía</strong><span>Divide el alcance en etapas claras para medir el avance.</span></div>`;
    els.reminderList.innerHTML = reminders.length ? reminders.map(reminderItem).join("") : `<div class="empty-state"><strong>Sin alertas todavía</strong><span>Registra aquí compras, pagos o decisiones con fecha.</span></div>`;
    els.drawerProgress.textContent = `${progress}%`;
    els.drawerProgressBar.style.width = `${progress}%`;
    els.saveStatus.textContent = "Cambios pendientes de guardar";
    refreshIcons();
  }

  function collectDraftForm() {
    if (!state.draft) return;
    Object.assign(state.draft, {
      status: els.projectStatus.value,
      location: els.projectLocation.value.trim(),
      startDate: els.projectStart.value,
      deadline: els.projectDeadline.value,
      scope: els.projectScope.value.trim(),
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
    const payload = {
      name,
      financeProjectName: "",
      status: "in_process",
      location: byId("new-location").value.trim(),
      deadline: byId("new-deadline").value,
      startDate: new Date().toISOString().slice(0, 10),
      scope: byId("new-scope").value.trim(),
      notes: "",
      progress: 0,
      tasks: [],
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

      const action = event.target.closest("[data-action]");
      if (!action) return;
      const taskNode = action.closest("[data-task-id]");
      const reminderNode = action.closest("[data-reminder-id]");
      if (action.dataset.action === "toggle-task" && taskNode) {
        const task = state.draft.tasks.find((item) => item.id === taskNode.dataset.taskId);
        if (task) task.done = !task.done;
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
    els.newProjectButton.addEventListener("click", () => els.newProjectModal.showModal());
    els.newProjectForm.addEventListener("submit", createProject);
    els.quickReminderButton.addEventListener("click", () => {
      if (!state.projects.length) return toast("Crea un trabajo antes de agregar alertas");
      openProject(state.projects[0]);
      setTimeout(() => els.reminderTitle.focus(), 200);
    });

    els.taskForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const title = els.taskTitle.value.trim();
      if (!title || !state.draft) return;
      state.draft.tasks.push({ id: uuid("task"), title, dueDate: els.taskDate.value, priority: els.taskPriority.value, done: false });
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
    els.notificationButton.innerHTML = `<i data-lucide="${active ? "bell-check" : "bell"}"></i><span>${active ? "Alertas activas" : "Activar alertas"}</span>`;
    refreshIcons();
  }

  async function showSystemNotification(title, body, tag) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        icon: "/images/icon-192.png?v=20260812",
        badge: "/images/icon-192.png?v=20260812",
        tag,
        data: { url: "/operaciones.html" },
      });
    } catch (error) {
      new Notification(title, { body, icon: "/images/icon-192.png?v=20260812", tag });
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
    if (!state.financeReady || !state.statusReady || !state.operationsReady) return;
    syncProjects();
    els.loadingScreen.classList.add("is-hidden");
    els.authScreen.classList.add("is-hidden");
    els.appShell.classList.remove("is-hidden");
    setSyncStatus(true, "Sincronizado");
  }

  function clearSubscriptions() {
    state.subscriptions.forEach((unsubscribe) => unsubscribe());
    state.subscriptions = [];
  }

  function subscribeData() {
    clearSubscriptions();
    state.financeReady = state.statusReady = state.operationsReady = false;
    setSyncStatus(false, "Sincronizando");

    state.subscriptions.push(
      state.db.collection("transacciones").orderBy("fecha", "desc").onSnapshot(
        (snapshot) => {
          state.transactions = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
          state.financeReady = true;
          maybeRevealApp();
        },
        (error) => dataError("movimientos financieros", error),
      ),
    );
    state.subscriptions.push(
      state.db.collection("config").doc("proyectos_estado").onSnapshot(
        (snapshot) => {
          state.projectStates = snapshot.exists ? snapshot.data() || {} : {};
          state.statusReady = true;
          maybeRevealApp();
        },
        (error) => dataError("estado de proyectos", error),
      ),
    );
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
  }

  function dataError(source, error) {
    console.error(`No se pudieron cargar ${source}`, error);
    setSyncStatus(false, "Conexión pendiente");
    if (source === "datos operativos") state.operationsReady = true;
    if (source === "movimientos financieros") state.financeReady = true;
    if (source === "estado de proyectos") state.statusReady = true;
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
      metricsGrid: byId("metrics-grid"), dashboardProjects: byId("dashboard-projects"), dashboardAgenda: byId("dashboard-agenda"), allProjects: byId("all-projects"), navProjectCount: byId("nav-project-count"), navAlertCount: byId("nav-alert-count"),
      projectSearch: byId("project-search"), statusFilters: byId("status-filters"), agendaSummary: byId("agenda-summary"), agendaTable: byId("agenda-table"), quickReminderButton: byId("quick-reminder-button"),
      drawerBackdrop: byId("drawer-backdrop"), projectDrawer: byId("project-drawer"), closeDrawerButton: byId("close-drawer-button"), drawerTitle: byId("drawer-title"), drawerSubtitle: byId("drawer-subtitle"), projectDocId: byId("project-doc-id"), projectStatus: byId("project-status"), projectLocation: byId("project-location"), projectStart: byId("project-start"), projectDeadline: byId("project-deadline"), projectScope: byId("project-scope"), projectNotes: byId("project-notes"),
      drawerProgress: byId("drawer-progress"), drawerProgressBar: byId("drawer-progress-bar"), taskList: byId("task-list"), taskForm: byId("task-form"), taskTitle: byId("task-title"), taskDate: byId("task-date"), taskPriority: byId("task-priority"), reminderList: byId("reminder-list"), reminderForm: byId("reminder-form"), reminderType: byId("reminder-type"), reminderTitle: byId("reminder-title"), reminderDate: byId("reminder-date"), reminderAmount: byId("reminder-amount"), reminderAlertDays: byId("reminder-alert-days"), saveStatus: byId("save-status"), saveProjectButton: byId("save-project-button"),
      newProjectModal: byId("new-project-modal"), newProjectForm: byId("new-project-form"), toast: byId("toast"),
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
      window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js?build=operations-v1", { updateViaCache: "none" }).catch(() => {}));
    }
  }

  init();
})();
