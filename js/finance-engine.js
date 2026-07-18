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
  const DEFAULT_SPLIT = { frank: 0.5, cristian: 0.5 };

  // Estos valores son la apertura oficial del motor. El historial existente
  // queda fuera del libro nuevo y no se vuelve a recalcular.
  const OPENING_STATE = Object.freeze({
    asOf: "2026-07-16",
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
      cash: money(source.cash),
      totalIncome: money(source.totalIncome),
      totalExpenses: money(source.totalExpenses),
      profitTotal: money(source.profitTotal),
      capitalActive: money(source.capitalActive),
      capital: clonePartners(source.capital),
      profitAvailable: clonePartners(source.profitAvailable),
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
    if (target && target.closed) {
      addError(state, "PROJECT_CLOSED", "No se puede registrar un gasto en un proyecto cerrado.", event);
      return;
    }
    state.cash -= amount;
    state.totalExpenses += amount;
    state.partnerExpenses[partner] += amount;
    state.activePartnerExpenses[partner] += amount;
    if (target) {
      target.expenses += amount;
      target.expenseByPartner[partner] += amount;
    }
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
    if (state.profitAvailable[partner] < amount) {
      addError(state, "PROFIT_INSUFFICIENT", "El retiro supera el profit disponible del socio.", event);
      return;
    }
    state.cash -= amount;
    state.profitAvailable[partner] -= amount;
    state.profitWithdrawals += amount;
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
    if (state.capital[from] < amount) {
      addError(state, "CAPITAL_INSUFFICIENT", "La transferencia supera el capital del socio emisor.", event);
      return;
    }
    state.capital[from] -= amount;
    state.capital[to] += amount;
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
    const split = event.split || DEFAULT_SPLIT;
    const frankShare = Number(split.frank);
    const cristianShare = Number(split.cristian);
    if (
      !Number.isFinite(frankShare) ||
      !Number.isFinite(cristianShare) ||
      frankShare < 0 ||
      cristianShare < 0 ||
      Math.abs(frankShare + cristianShare - 1) > 0.000001
    ) {
      addError(state, "INVALID_SPLIT", "El reparto del proyecto debe sumar 100%.", event);
      return;
    }
    const releasedCapital = clonePartners(target.capital);
    const settledIncome = clonePartners(target.incomeByPartner);
    const settledExpenses = clonePartners(target.expenseByPartner);
    const releasedTotal = releasedCapital.frank + releasedCapital.cristian;
    const distributable = money(releasedTotal + utility);
    const targetProfit = money(
      (state.profitAvailable.frank +
        state.profitAvailable.cristian +
        distributable) /
        2,
    );
    // El cierre no vuelve a dividir el capital. Libera el capital del proyecto
    // y distribuye capital + utilidad para que ambos profits terminen iguales.
    // Si uno ya tiene mas profit, su asignacion puede ser menor (o negativa)
    // porque esta operación también corrige el desequilibrio acumulado.
    const profitByPartner = {
      frank: money(targetProfit - state.profitAvailable.frank),
      cristian: money(targetProfit - state.profitAvailable.cristian),
    };
    PARTNERS.forEach((partner) => {
      state.capital[partner] -= releasedCapital[partner];
      state.partnerIncome[partner] -= settledIncome[partner];
      state.activePartnerExpenses[partner] -= settledExpenses[partner];
      state.profitAvailable[partner] += profitByPartner[partner];
    });
    state.capitalActive -= releasedTotal;
    state.profitTotal += distributable;
    target.profit = distributable;
    target.closed = true;
    target.closeId = event.id || null;
    target.closeSnapshot = {
      income: target.income,
      expenses: target.expenses,
      utility,
      legacyCapital: money(target.legacyCapital),
      distributable,
      releasedCapital,
      settledIncome,
      settledExpenses,
      profitByPartner,
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
      .filter((event) => event && event.motorVersion === ENGINE_VERSION)
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
      partnerExpenses: clonePartners(opening.partnerExpenses),
      partnerIncome: clonePartners(opening.partnerIncome),
      activePartnerExpenses: clonePartners(opening.activePartnerExpenses),
      profitWithdrawals: money(opening.profitTotal - opening.profitAvailable.frank - opening.profitAvailable.cristian),
      projects: cloneOpeningProjects(input && input.openingProjects),
      eventCount: events.length,
      validation: { valid: true, errors: [], checks: {} },
    };

    events.forEach((event, index) => {
      const type = eventType(event);
      if (type === "income") applyIncome(state, event);
      else if (type === "legacy_income_allocation") applyLegacyIncomeAllocation(state, event);
      else if (type === "expense") applyExpense(state, event);
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
      frank: money(state.capital.frank + state.partnerIncome.frank - state.activePartnerExpenses.frank),
      cristian: money(state.capital.cristian + state.partnerIncome.cristian - state.activePartnerExpenses.cristian),
    };
    state.balanceByPartner = {
      frank: money(state.workingCapital.frank + state.profitAvailable.frank),
      cristian: money(state.workingCapital.cristian + state.profitAvailable.cristian),
    };
    state.workingCapitalActive = money(
      state.workingCapital.frank + state.workingCapital.cristian,
    );

    const expectedCash = money(
      opening.cash +
        (state.totalIncome - opening.totalIncome) -
        (state.totalExpenses - opening.totalExpenses) +
        events.reduce((sum, event) => {
          const type = eventType(event);
          if (type === "capital_contribution") return sum + eventAmount(event);
          if (type === "capital_withdrawal" || type === "profit_withdrawal") return sum - eventAmount(event);
          return sum;
        }, 0),
    );
    const openingCapitalDifference = money(opening.capital.frank + opening.capital.cristian - opening.capitalActive);
    const capitalDifference = money(state.capitalPartnersTotal - state.capitalActive);
    const expectedProfitTotal = money(
      state.profitAvailableTotal + state.profitWithdrawals,
    );

    state.validation.checks = {
      capital: {
        valid: capitalDifference === openingCapitalDifference,
        partners: state.capitalPartnersTotal,
        active: state.capitalActive,
        openingRounding: openingCapitalDifference,
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

  return Object.freeze({
    ENGINE_VERSION,
    PARTNERS,
    PARTNER_NAMES,
    OPENING_STATE,
    calculate,
    eventType,
    makeEvent,
    partnerKey,
  });
});
