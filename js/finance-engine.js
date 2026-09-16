(function installFinanceMobileLayoutRepair(global) {
  if (!global || typeof document === "undefined") return;

  function repairFinanceMobileLayout() {
    const root = document.documentElement;
    root.classList.remove("fz-phone");
    root.style.removeProperty("--fz-phone-ratio");
    root.style.removeProperty("zoom");
    root.style.removeProperty("width");

    if (document.body) {
      document.body.style.removeProperty("zoom");
      document.body.style.setProperty("width", "100%", "important");
      document.body.style.setProperty("max-width", "none", "important");
    }

    const app = document.getElementById("main-app");
    if (app) {
      app.style.removeProperty("zoom");
      app.style.removeProperty("width");
      app.style.removeProperty("max-width");
    }
  }

  global.CBDFinanceMobileReset = repairFinanceMobileLayout;
  repairFinanceMobileLayout();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", repairFinanceMobileLayout, { once: true });
  }
  global.addEventListener("pageshow", repairFinanceMobileLayout);
  global.setTimeout(repairFinanceMobileLayout, 0);
  global.setTimeout(repairFinanceMobileLayout, 500);
})(typeof window !== "undefined" ? window : null);
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.CBDFinanceEngine = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const ENGINE_VERSION = 1;
  const PARTNERS = ["frank", "cristian"];
  const PARTNER_NAMES = { frank: "Frank", cristian: "Cristian" };
  const ORCHID_PROJECT_NAME = "Bote ORCHID";
  const ORCHID_PROJECT_ALIASES = new Set(["orchid", "bote orchid"]);

  // Estos valores son la apertura oficial del motor. El historial existente
  // queda fuera del libro nuevo y no se vuelve a recalcular.
  const OPENING_STATE = Object.freeze({
    asOf: "2026-07-12",
    asOfTime: "19:02",
    cash: 5302137,
    totalIncome: 21429510,
    totalExpenses: 11703959,
    profitTotal: 9725551,
    capitalActive: 820000,
    capital: Object.freeze({ frank: 2651068.5, cristian: 2651068.5 }),
    profitAvailable: Object.freeze({ frank: 0, cristian: 0 }),
  });

  function money(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return Math.round((number + Number.EPSILON) * 100) / 100;
  }

  function positiveMoney(value) {
    const amount = money(value);
    return amount > 0 ? amount : 0;
  }

  function partnerKey(value) {
    const key = String(value || "").trim().toLowerCase();
    return PARTNERS.includes(key) ? key : "";
  }

  function canonicalProjectName(value) {
    const name = String(value || "").trim();
    return ORCHID_PROJECT_ALIASES.has(name.toLowerCase())
      ? ORCHID_PROJECT_NAME
      : name;
  }

  function projectId(value) {
    return canonicalProjectName(value)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function clonePartners(values, fallback = 0) {
    return PARTNERS.reduce((result, partner) => {
      result[partner] = money(values && values[partner] != null ? values[partner] : fallback);
      return result;
    }, {});
  }

  function normalizeOpening(opening) {
    const source = opening || OPENING_STATE;
    return {
      asOf: source.asOf || OPENING_STATE.asOf,
      asOfTime: source.asOfTime || "00:00",
      cash: money(source.cash),
      totalIncome: money(source.totalIncome),
      totalExpenses: money(source.totalExpenses),
      profitTotal: money(source.profitTotal),
      capitalActive: money(source.capitalActive),
      capital: clonePartners(source.capital),
      profitAvailable: clonePartners(source.profitAvailable),
      accountWithdrawals: clonePartners(source.accountWithdrawals),
      partnerExpenses: clonePartners(source.partnerExpenses),
      partnerIncome: clonePartners(source.partnerIncome),
      activePartnerExpenses: clonePartners(source.activePartnerExpenses),
    };
  }

  function eventType(event) {
    if (!event || event.motorVersion !== ENGINE_VERSION) return "";
    if (event.motorType) return event.motorType;
    if (event.reversalOf) return "project_reopen";
    if (!event.tipo && !event.categoria && projectName(event)) return "project_close";
    if (event.tipo === "ingreso") return "income";
    if (event.tipo === "gasto") return "expense";
    return "";
  }

  function eventAmount(event) {
    return positiveMoney(event && (event.amount != null ? event.amount : event.monto));
  }

  function eventDate(event) {
    return String((event && event.fecha) || "9999-12-31");
  }

  function eventTime(event) {
    return String((event && event.hora) || "00:00");
  }

  function isAfterOpening(event, opening) {
    const eventKey = eventDate(event) + "T" + eventTime(event);
    const openingKey = String(opening.asOf || "0000-00-00") + "T" +
      String(opening.asOfTime || "00:00");
    return eventKey > openingKey;
  }

  function compareEvents(a, b) {
    const left = eventDate(a) + "T" + eventTime(a);
    const right = eventDate(b) + "T" + eventTime(b);
    if (left !== right) return left.localeCompare(right);
    const createdDifference = Number(a.createdAt || 0) - Number(b.createdAt || 0);
    if (createdDifference) return createdDifference;
    return String(a.id || "").localeCompare(String(b.id || ""));
  }

  function projectName(event) {
    return String((event && (event.project || event.proyecto)) || "").trim();
  }

  function ensureProject(projects, name) {
    if (!projects[name]) {
      projects[name] = {
        name,
        income: 0,
        incomeByPartner: { frank: 0, cristian: 0 },
        expenses: 0,
        expenseByPartner: { frank: 0, cristian: 0 },
        capital: { frank: 0, cristian: 0 },
        legacyCapital: 0,
        profit: 0,
        closed: false,
        closeId: null,
      };
    }
    return projects[name];
  }

  function cloneOpeningProjects(source) {
    const result = {};
    Object.entries(source || {}).forEach(([name, project]) => {
      result[name] = {
        name,
        income: money(project.income),
        incomeByPartner: clonePartners(project.incomeByPartner),
        expenses: money(project.expenses),
        expenseByPartner: clonePartners(project.expenseByPartner),
        capital: clonePartners(project.capital),
        legacyCapital: money(project.legacyCapital),
        profit: 0,
        closed: false,
        closeId: null,
        closeSnapshot: null,
      };
    });
    return result;
  }

  function addError(state, code, message, event) {
    state.validation.valid = false;
    state.validation.errors.push({
      code,
      message,
      eventId: event && event.id ? event.id : null,
    });
  }

  function requirePartner(state, event, field) {
    const partner = partnerKey(event && event[field]);
    if (!partner) {
      addError(
        state,
        "INVALID_PARTNER",
        "El evento requiere un socio responsable valido.",
        event,
      );
    }
    return partner;
  }

  function requireAmount(state, event) {
    const amount = eventAmount(event);
    if (!amount) {
      addError(state, "INVALID_AMOUNT", "El monto debe ser mayor que cero.", event);
    }
    return amount;
  }

  function applyIncome(state, event) {
    const amount = requireAmount(state, event);
    const partner = requirePartner(state, event, "receptor");
    if (!amount) return;
    const project = projectName(event);
    if (!project) {
      addError(state, "PROJECT_REQUIRED", "Todo ingreso nuevo requiere un proyecto.", event);
      return;
    }
    if (!partner) return;
    const target = ensureProject(state.projects, project);
    if (target.closed) {
      addError(state, "PROJECT_CLOSED", "No se puede registrar un ingreso en un proyecto cerrado.", event);
      return;
    }
    state.cash += amount;
    state.totalIncome += amount;
    state.partnerIncome[partner] += amount;
    target.income += amount;
    target.incomeByPartner[partner] += amount;
  }

  function applyLegacyIncomeAllocation(state, event) {
    const amount = requireAmount(state, event);
    const partner = requirePartner(state, event, "receptor");
    const project = projectName(event);
    if (!project) {
      addError(state, "PROJECT_REQUIRED", "La asignacion requiere un proyecto.", event);
      return;
    }
    if (!amount || !partner) return;
    const target = ensureProject(state.projects, project);
    if (target.closed) {
      addError(state, "PROJECT_CLOSED", "No se puede asignar ingreso a un proyecto cerrado.", event);
      return;
    }
    // El ingreso ya existe en el historico global. Aqui solo se asigna a la
    // cuenta del socio sin duplicar caja, ingresos ni el balance del proyecto.
    state.partnerIncome[partner] += amount;
    target.incomeByPartner[partner] += amount;
  }

  function applyExpense(state, event) {
    const amount = requireAmount(state, event);
    const partner = requirePartner(state, event, "responsible");
    const project = projectName(event);
    if (!amount || !partner) return;
    const target = project ? ensureProject(state.projects, project) : null;
    if (event.fundingSource && !["company", "personal"].includes(event.fundingSource)) {
      addError(state, "INVALID_FUNDING_SOURCE", "Selecciona dinero de la empresa o capital personal.", event);
      return;
    }
    if (target && target.closed) {
      addError(state, "PROJECT_CLOSED", "No se puede registrar un gasto en un proyecto cerrado.", event);
      return;
    }
    const personal = event.fundingSource === "personal";
    if (personal) {
      state.personalDue[partner] += amount;
      state.personalContributions[partner] += amount;
      state.personalFunded += amount;
    } else {
      state.cash -= amount;
      state.activePartnerExpenses[partner] += amount;
    }
    state.totalExpenses += amount;
    state.partnerExpenses[partner] += amount;
    if (target) {
      target.expenses += amount;
      target.expenseByPartner[partner] += amount;
    } else if (personal) {
      state.profitTotal -= amount;
      state.realizedProfitChange -= amount;
    }
  }

  function applyPersonalRepayment(state, event) {
    const amount = requireAmount(state, event);
    const payer = requirePartner(state, event, "responsible");
    const beneficiary = requirePartner(state, event, "beneficiary");
    if (!amount || !payer || !beneficiary) return;
    const available = money(state.capital[payer] + state.partnerIncome[payer] -
      state.activePartnerExpenses[payer] - state.accountWithdrawals[payer]);
    if (amount > money(state.personalDue[beneficiary])) {
      addError(state, "PERSONAL_REPAYMENT_EXCEEDED", "La devolución supera el capital personal pendiente de ese socio.", event);
      return;
    }
    if (amount > state.cash || amount > available) {
      addError(state, "ACCOUNT_INSUFFICIENT", "No hay fondos de empresa suficientes en la cuenta de quien paga.", event);
      return;
    }
    state.personalDue[beneficiary] = money(state.personalDue[beneficiary] - amount);
    state.personalRepaid += amount;
    state.personalReturned[beneficiary] += amount;
    state.cash -= amount;
    state.accountWithdrawals[payer] += amount;
  }

  function applyCapitalContribution(state, event) {
    const amount = requireAmount(state, event);
    const partner = requirePartner(state, event, "responsible");
    const project = projectName(event);
    if (!project) {
      addError(state, "PROJECT_REQUIRED", "Un aporte de capital requiere un proyecto.", event);
      return;
    }
    if (!amount || !partner) return;
    const target = ensureProject(state.projects, project);
    if (target.closed) {
      addError(state, "PROJECT_CLOSED", "No se puede aportar capital a un proyecto cerrado.", event);
      return;
    }
    state.cash += amount;
    state.capitalActive += amount;
    state.capital[partner] += amount;
    target.capital[partner] += amount;
  }

  function applyCapitalWithdrawal(state, event) {
    const amount = requireAmount(state, event);
    const partner = requirePartner(state, event, "responsible");
    const project = projectName(event);
    if (!project) {
      addError(state, "PROJECT_REQUIRED", "Un retiro de capital requiere un proyecto.", event);
      return;
    }
    if (!amount || !partner) return;
    const target = ensureProject(state.projects, project);
    if (target.closed) {
      addError(state, "PROJECT_CLOSED", "No se puede retirar capital de un proyecto cerrado.", event);
      return;
    }
    if (target.capital[partner] < amount || state.capital[partner] < amount) {
      addError(state, "CAPITAL_INSUFFICIENT", "El retiro supera el capital disponible del socio.", event);
      return;
    }
    state.cash -= amount;
    state.capitalActive -= amount;
    state.capital[partner] -= amount;
    target.capital[partner] -= amount;
  }

  function applyProfitWithdrawal(state, event) {
    const amount = requireAmount(state, event);
    const partner = requirePartner(state, event, "responsible");
    if (!amount || !partner) return;
    const accountBalance =
      state.capital[partner] +
      state.partnerIncome[partner] -
      state.activePartnerExpenses[partner] -
      state.accountWithdrawals[partner];
    if (accountBalance < amount) {
      addError(state, "ACCOUNT_INSUFFICIENT", "El retiro supera el dinero disponible en cuenta del socio.", event);
      return;
    }
    state.cash -= amount;
    // Money withdrawn belongs to the partner: refund their advance first.
    // Keep distributed profit in the allocation so it is never paid twice.
    const personalPortion = Math.min(state.personalDue[partner], amount);
    state.personalDue[partner] = money(state.personalDue[partner] - personalPortion);
    state.personalReturned[partner] += personalPortion;
    if (event.settlementVersion === 2 || state.personalFunded > 0) {
      state.profitTaken[partner] += amount - personalPortion;
    }
    const profitPortion = Math.min(state.profitAvailable[partner], amount - personalPortion);
    state.profitAvailable[partner] -= profitPortion;
    state.accountWithdrawals[partner] += amount;
    state.profitWithdrawals += profitPortion;
  }

  function applyCapitalTransfer(state, event) {
    if (event.direction === "to" || event.motorDirection === "to") return;
    const amount = requireAmount(state, event);
    const from = partnerKey(event.from || event.de);
    const to = partnerKey(event.to || event.para);
    if (!from || !to || from === to) {
      addError(state, "INVALID_TRANSFER", "La transferencia debe tener socios distintos y validos.", event);
      return;
    }
    if (!amount) return;
    const available = money(state.capital[from] + state.partnerIncome[from] -
      state.activePartnerExpenses[from] - state.accountWithdrawals[from]);
    if (available < amount) {
      addError(state, "CAPITAL_INSUFFICIENT", "La transferencia supera el dinero de empresa en la cuenta del socio emisor.", event);
      return;
    }
    state.capital[from] -= amount;
    state.capital[to] += amount;
  }

  // Equalize the shared result, preserving each partner's own reimbursable
  // money. Transfers change custody, not ownership, so repeating a calculation
  // after recording the transfer cannot reimburse the same contribution twice.
  function settlementFor(state) {
    const balances = {};
    PARTNERS.forEach((partner) => {
      balances[partner] = money(state.capital[partner] + state.partnerIncome[partner] -
        state.activePartnerExpenses[partner] - state.accountWithdrawals[partner]);
    });
    const cash = money(balances.frank + balances.cristian);
    const shared = money((cash - state.personalDue.frank - state.personalDue.cristian +
      state.profitTaken.frank + state.profitTaken.cristian) / 2);
    let targetFrank = money(state.personalDue.frank + shared - state.profitTaken.frank);
    // A shortfall remains in the personal ledger, without proposing a transfer
    // of money that neither account has or blocking the available distribution.
    if (cash >= 0) targetFrank = Math.max(0, Math.min(cash, targetFrank));
    const difference = money(balances.frank - targetFrank);
    if (Math.abs(difference) < 0.01) return null;
    const from = difference > 0 ? "frank" : "cristian";
    const to = from === "frank" ? "cristian" : "frank";
    const amount = money(Math.min(Math.abs(difference), Math.max(0, balances[from])));
    return amount > 0 ? { from, to, amount } : null;
  }

  function applyProjectClose(state, event) {
    const name = projectName(event);
    if (!name) {
      addError(state, "PROJECT_REQUIRED", "El cierre requiere un proyecto.", event);
      return;
    }
    const target = ensureProject(state.projects, name);
    if (target.closed) {
      addError(state, "PROJECT_ALREADY_CLOSED", "El proyecto ya esta cerrado.", event);
      return;
    }
    const utility = money(
      target.income - target.expenses - money(target.legacyCapital),
    );
    const releasedCapital = clonePartners(target.capital);
    const releasedTotal = releasedCapital.frank + releasedCapital.cristian;
    const projectProfit = money(target.income - target.expenses);
    const accountAtClose = {
      frank: money(
        state.capital.frank + state.partnerIncome.frank -
          state.activePartnerExpenses.frank - state.accountWithdrawals.frank,
      ),
      cristian: money(
        state.capital.cristian + state.partnerIncome.cristian -
          state.activePartnerExpenses.cristian - state.accountWithdrawals.cristian,
      ),
    };
    const settlement = settlementFor(state);

    // Cerrar clasifica el resultado del proyecto, pero nunca mueve el dinero
    // fisico entre socios. Una compensacion requiere su propia transferencia.
    state.capitalActive -= releasedTotal;
    state.releasedProjectCapital += releasedTotal;
    state.realizedProfitChange += utility;
    state.profitTotal += utility;
    target.profit = projectProfit;
    target.closed = true;
    target.closeId = event.id || null;
    target.closeSnapshot = {
      income: target.income,
      expenses: target.expenses,
      utility,
      legacyCapital: money(target.legacyCapital),
      projectProfit,
      releasedCapital,
      settledIncome: clonePartners(target.incomeByPartner),
      settledExpenses: clonePartners(target.expenseByPartner),
      accountAtClose,
      personalDue: clonePartners(state.personalDue),
      settlement,
    };
  }

  function applyProjectReopen(state, event, eventIndex, events) {
    // Los cierres son definitivos. Se conserva el reconocimiento de eventos
    // antiguos de reapertura para que no rompan el libro, pero nunca revierten
    // el capital ni el profit de un proyecto ya cerrado.
    return;
  }

  function calculate(input) {
    const opening = normalizeOpening(input && input.opening);
    const allEvents = Array.isArray(input && input.transactions) ? input.transactions : [];
    const events = allEvents
      .filter(
        (event) =>
          event &&
          event.archived !== true &&
          event.motorVersion === ENGINE_VERSION &&
          isAfterOpening(event, opening),
      )
      .slice()
      .sort(compareEvents);
    const state = {
      engineVersion: ENGINE_VERSION,
      asOf: opening.asOf,
      cash: opening.cash,
      totalIncome: opening.totalIncome,
      totalExpenses: opening.totalExpenses,
      profitTotal: opening.profitTotal,
      capitalActive: opening.capitalActive,
      capital: clonePartners(opening.capital),
      profitAvailable: clonePartners(opening.profitAvailable),
      accountWithdrawals: clonePartners(opening.accountWithdrawals),
      partnerExpenses: clonePartners(opening.partnerExpenses),
      partnerIncome: clonePartners(opening.partnerIncome),
      activePartnerExpenses: clonePartners(opening.activePartnerExpenses),
      profitWithdrawals: money(opening.profitTotal - opening.profitAvailable.frank - opening.profitAvailable.cristian),
      releasedProjectCapital: 0,
      realizedProfitChange: 0,
      personalDue: { frank: 0, cristian: 0 },
      personalContributions: { frank: 0, cristian: 0 },
      personalReturned: { frank: 0, cristian: 0 },
      profitTaken: { frank: 0, cristian: 0 },
      personalFunded: 0,
      personalRepaid: 0,
      projects: cloneOpeningProjects(input && input.openingProjects),
      eventCount: events.length,
      validation: { valid: true, errors: [], checks: {} },
    };

    events.forEach((event, index) => {
      const type = eventType(event);
      if (type === "income") applyIncome(state, event);
      else if (type === "legacy_income_allocation") applyLegacyIncomeAllocation(state, event);
      else if (type === "expense") applyExpense(state, event);
      else if (type === "personal_repayment") applyPersonalRepayment(state, event);
      else if (type === "capital_contribution") applyCapitalContribution(state, event);
      else if (type === "capital_withdrawal") applyCapitalWithdrawal(state, event);
      else if (type === "profit_withdrawal") applyProfitWithdrawal(state, event);
      else if (type === "capital_transfer") applyCapitalTransfer(state, event);
      else if (type === "project_close") applyProjectClose(state, event);
      else if (type === "project_reopen") applyProjectReopen(state, event, index, events);
      else addError(state, "UNKNOWN_EVENT", "El evento no tiene un tipo financiero valido.", event);
    });

    state.capitalActive = money(state.capitalActive);
    state.profitTotal = money(state.profitTotal);
    state.cash = money(state.cash);
    state.totalIncome = money(state.totalIncome);
    state.totalExpenses = money(state.totalExpenses);
    state.profitAvailableTotal = money(state.profitAvailable.frank + state.profitAvailable.cristian);
    state.partnerExpensesTotal = money(state.partnerExpenses.frank + state.partnerExpenses.cristian);
    state.partnerIncomeTotal = money(state.partnerIncome.frank + state.partnerIncome.cristian);
    state.capitalPartnersTotal = money(state.capital.frank + state.capital.cristian);
    state.workingCapital = {
      frank: money(
        state.capital.frank +
          state.partnerIncome.frank -
          state.activePartnerExpenses.frank -
          state.accountWithdrawals.frank,
      ),
      cristian: money(
        state.capital.cristian +
          state.partnerIncome.cristian -
          state.activePartnerExpenses.cristian -
          state.accountWithdrawals.cristian,
      ),
    };
    state.balanceByPartner = {
      frank: state.workingCapital.frank,
      cristian: state.workingCapital.cristian,
    };
    state.workingCapitalActive = money(
      state.workingCapital.frank + state.workingCapital.cristian,
    );
    state.personalDueTotal = money(state.personalDue.frank + state.personalDue.cristian);
    state.settlement = settlementFor(state);

    const expectedCash = money(
      opening.cash +
        (state.totalIncome - opening.totalIncome) -
        (state.totalExpenses - opening.totalExpenses) + state.personalFunded - state.personalRepaid +
        events.reduce((sum, event) => {
          const type = eventType(event);
          if (type === "capital_contribution") return sum + eventAmount(event);
          if (type === "capital_withdrawal" || type === "profit_withdrawal") return sum - eventAmount(event);
          return sum;
        }, 0),
    );
    const openingCapitalDifference = money(opening.capital.frank + opening.capital.cristian - opening.capitalActive);
    const capitalDifference = money(state.capitalPartnersTotal - state.capitalActive);
    const expectedCapitalDifference = money(
      openingCapitalDifference + state.releasedProjectCapital,
    );
    const expectedProfitTotal = money(opening.profitTotal + state.realizedProfitChange);

    state.validation.checks = {
      capital: {
        valid: capitalDifference === expectedCapitalDifference,
        partners: state.capitalPartnersTotal,
        active: state.capitalActive,
        openingRounding: openingCapitalDifference,
        released: state.releasedProjectCapital,
      },
      profit: {
        valid: expectedProfitTotal === state.profitTotal,
        available: state.profitAvailableTotal,
        withdrawn: state.profitWithdrawals,
        total: state.profitTotal,
      },
      cash: {
        valid: expectedCash === state.cash,
        expected: expectedCash,
        actual: state.cash,
      },
    };

    Object.entries(state.validation.checks).forEach(([name, check]) => {
      if (!check.valid) {
        addError(state, "BALANCE_" + name.toUpperCase(), "La validacion de " + name + " no cuadra.");
      }
    });

    return state;
  }

  function makeEvent(type, values) {
    return Object.assign(
      {
        motorVersion: ENGINE_VERSION,
        motorType: type,
      },
      values || {},
    );
  }

  function findBlockingValidationError(previousState, nextState, eventIds) {
    const previousErrors =
      (previousState && previousState.validation && previousState.validation.errors) || [];
    const nextErrors =
      (nextState && nextState.validation && nextState.validation.errors) || [];
    const currentEventIds = new Set((eventIds || []).filter(Boolean).map(String));
    const previousKeys = new Set(
      previousErrors.map((error) =>
        [error.code || "", error.eventId || ""].map(String).join("|"),
      ),
    );

    return (
      nextErrors.find((error) => {
        const key = [error.code || "", error.eventId || ""]
          .map(String)
          .join("|");
        return (
          currentEventIds.has(String(error.eventId || "")) ||
          !previousKeys.has(key)
        );
      }) || null
    );
  }

  return Object.freeze({
    ENGINE_VERSION,
    PARTNERS,
    PARTNER_NAMES,
    OPENING_STATE,
    calculate,
    canonicalProjectName,
    projectId,
    eventType,
    findBlockingValidationError,
    makeEvent,
    partnerKey,
  });
});
