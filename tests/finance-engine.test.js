const assert = require("assert");
const engine = require("../js/finance-engine.js");

function calculate(events, opening, openingProjects) {
  return engine.calculate({
    transactions: events,
    opening: opening || engine.OPENING_STATE,
    openingProjects,
  });
}

function event(type, values) {
  return engine.makeEvent(type, Object.assign({ fecha: "2026-07-17", hora: "09:00" }, values));
}

function assertValid(state) {
  assert.equal(state.validation.valid, true, JSON.stringify(state.validation.errors));
  Object.values(state.validation.checks).forEach((check) => assert.equal(check.valid, true));
}

// La apertura oficial se conserva, incluyendo los redondeos visibles de la UI.
{
  const state = calculate([]);
  assert.equal(state.totalIncome, 21429510);
  assert.equal(state.totalExpenses, 11703959);
  assert.equal(state.profitTotal, 9725551);
  assert.equal(state.capitalActive, 820000);
  assert.equal(state.workingCapitalActive, 5302137);
  assert.equal(Math.round(state.capital.frank), 2651069);
  assert.equal(Math.round(state.capital.cristian), 2651069);
  assert.equal(state.profitAvailable.frank, 0);
  assert.equal(state.profitAvailable.cristian, 0);
  assertValid(state);
}

// Aporte, ingreso y gasto: ingresos y gastos actualizan el saldo del socio
// correspondiente, mientras el capital solo cambia con el aporte.
{
  const state = calculate([
    event("capital_contribution", { project: "Orchid", responsible: "Frank", monto: 1500000 }),
    event("income", { project: "Orchid", receptor: "Frank", monto: 5000000 }),
    event("expense", { project: "Orchid", responsible: "Frank", monto: 2000000 }),
  ]);
  assertValid(state);
  assert.equal(state.capital.frank, 4151068.5);
  assert.equal(state.capital.cristian, 2651068.5);
  assert.equal(state.profitAvailable.frank, 0);
  assert.equal(state.profitAvailable.cristian, 0);
  assert.equal(state.cash, 9802137);
  assert.equal(state.totalIncome, 26429510);
  assert.equal(state.totalExpenses, 13703959);
  assert.equal(state.balanceByPartner.frank, 4151068.5 + 5000000 - 2000000);
  assert.equal(state.balanceByPartner.cristian, 2651068.5);
  assert.equal(state.workingCapital.frank, 4151068.5 + 5000000 - 2000000);
  assert.equal(state.workingCapital.cristian, 2651068.5);
}

// El receptor de una entrada ve el aumento de su cuenta inmediatamente; al
// cerrar, la entrada pendiente se convierte en profit y no se duplica.
{
  const before = calculate([]);
  const open = calculate([
    event("income", { project: "Recepcion", receptor: "Cristian", monto: 1500000 }),
  ]);
  assertValid(open);
  assert.equal(open.balanceByPartner.frank, before.balanceByPartner.frank);
  assert.equal(open.balanceByPartner.cristian, before.balanceByPartner.cristian + 1500000);
  const closed = calculate([
    event("income", { project: "Recepcion", receptor: "Cristian", monto: 1500000 }),
    event("project_close", { id: "cierre-recepcion", project: "Recepcion" }),
  ]);
  assertValid(closed);
  assert.equal(closed.partnerIncome.cristian, 0);
}

// Una entrada historica puede asignarse a un socio sin duplicar los totales
// globales ni el balance del proyecto.
{
  const state = calculate(
    [
      event("legacy_income_allocation", {
        project: "Orchid",
        receptor: "Frank",
        monto: 1495000,
      }),
    ],
    engine.OPENING_STATE,
    {
      Orchid: {
        income: 1495000,
        expenses: 675000,
        legacyCapital: 820000,
        capital: { frank: 410000, cristian: 410000 },
      },
    },
  );
  assertValid(state);
  assert.equal(state.totalIncome, engine.OPENING_STATE.totalIncome);
  assert.equal(state.projects.Orchid.income, 1495000);
  assert.equal(state.partnerIncome.frank, 1495000);
}

// Cierre: libera el capital del proyecto y pasa su utilidad al profit 50/50.
{
  const state = calculate([
    event("capital_contribution", { id: "aporte-orchid", project: "Orchid", responsible: "Frank", monto: 1500000 }),
    event("income", { project: "Orchid", receptor: "Cristian", monto: 5000000 }),
    event("expense", { project: "Orchid", responsible: "Cristian", monto: 2000000 }),
    event("project_close", { id: "cierre-orchid", project: "Orchid", split: { frank: 0.5, cristian: 0.5 } }),
  ]);
  assertValid(state);
  assert.equal(state.capitalActive, 820000);
  assert.equal(state.capital.frank, 2651068.5);
  assert.equal(state.profitAvailable.frank, 2250000);
  assert.equal(state.profitAvailable.cristian, 2250000);
  assert.equal(state.profitTotal, 14225551);
  assert.equal(state.projects.Orchid.closed, true);
  assert.equal(state.projects.Orchid.profit, 4500000);
}

// Un evento antiguo de reapertura nunca revierte un cierre definitivo.
{
  const state = calculate([
    event("project_close", { id: "cierre-definitivo", project: "Orchid" }),
    event("project_reopen", {
      project: "Orchid",
      reversalOf: "cierre-definitivo",
    }),
  ]);
  assertValid(state);
  assert.equal(state.projects.Orchid.closed, true);
}

// Si los profits llegan desiguales al cierre, el socio con menos recibe mas.
{
  const opening = {
    asOf: "2026-07-16",
    cash: 1000,
    totalIncome: 0,
    totalExpenses: 0,
    profitTotal: 100,
    capitalActive: 1000,
    capital: { frank: 1000, cristian: 0 },
    profitAvailable: { frank: 100, cristian: 0 },
  };
  const state = calculate([
    event("capital_contribution", { project: "Equalize", responsible: "Frank", monto: 1000 }),
    event("project_close", { project: "Equalize" }),
  ], opening);
  assertValid(state);
  assert.equal(state.capitalActive, 1000);
  assert.equal(state.profitAvailable.frank, 550);
  assert.equal(state.profitAvailable.cristian, 550);
}

// Los gastos de un proyecto cerrado afectan su profit, pero no el capital de
// trabajo de los proyectos que siguen activos.
{
  const state = calculate(
    [
      event("expense", {
        id: "mano-obra-orchid",
        project: "Bote ORCHID",
        responsible: "Cristian",
        receptor: "Cristian",
        categoria: "Mano de Obra",
        tipo: "gasto",
        monto: 500000,
        hora: "12:00",
      }),
      event("project_close", {
        id: "cierre-orchid-con-gasto",
        project: "Bote ORCHID",
        hora: "23:59",
      }),
    ],
    engine.OPENING_STATE,
    {
      "Bote ORCHID": {
        income: 1495000,
        expenses: 675000,
        capital: { frank: 410000, cristian: 410000 },
        legacyCapital: 820000,
      },
    },
  );
  assertValid(state);
  assert.equal(state.projects["Bote ORCHID"].profit, 320000);
  assert.equal(state.workingCapitalActive, 4482137);
  assert.equal(state.activePartnerExpenses.cristian, 0);
}

// Retiro de profit: solo toca caja y el profit del socio que retira.
{
  const opening = Object.assign({}, engine.OPENING_STATE, {
    profitTotal: 500000,
    profitAvailable: { frank: 500000, cristian: 0 },
  });
  const before = calculate([], opening);
  const state = calculate(
    [event("profit_withdrawal", { responsible: "Frank", monto: 500000 })],
    opening,
  );
  assertValid(state);
  assert.equal(state.profitAvailable.frank, before.profitAvailable.frank - 500000);
  assert.equal(state.profitAvailable.cristian, before.profitAvailable.cristian);
  assert.equal(state.capital.frank, before.capital.frank);
  assert.equal(state.cash, before.cash - 500000);
}

// Equilibrio: mueve exclusivamente capital y no cambia caja ni profit.
{
  const before = calculate([]);
  const state = calculate([
    event("capital_transfer", { from: "Frank", to: "Cristian", monto: 100000 }),
  ]);
  assertValid(state);
  assert.equal(state.capital.frank, before.capital.frank - 100000);
  assert.equal(state.capital.cristian, before.capital.cristian + 100000);
  assert.equal(state.cash, before.cash);
  assert.equal(state.profitTotal, before.profitTotal);
  assert.deepEqual(state.profitAvailable, before.profitAvailable);
}

// El par de documentos de una transferencia representa un solo movimiento.
{
  const before = calculate([]);
  const state = calculate([
    event("capital_transfer", {
      id: "transfer-from",
      from: "Frank",
      to: "Cristian",
      motorDirection: "from",
      monto: 100000,
    }),
    event("capital_transfer", {
      id: "transfer-to",
      from: "Frank",
      to: "Cristian",
      motorDirection: "to",
      monto: 100000,
    }),
  ]);
  assertValid(state);
  assert.equal(state.capital.frank, before.capital.frank - 100000);
  assert.equal(state.capital.cristian, before.capital.cristian + 100000);
}

// Varios proyectos y operaciones consecutivas no se cruzan entre si.
{
  const state = calculate([
    event("capital_contribution", { project: "A", responsible: "Frank", monto: 461000 }),
    event("capital_contribution", { project: "B", responsible: "Cristian", monto: 300000 }),
    event("income", { project: "A", receptor: "Frank", monto: 1000000 }),
    event("expense", { project: "B", responsible: "Cristian", monto: 100000 }),
  ]);
  assertValid(state);
  assert.equal(state.projects.A.income, 1000000);
  assert.equal(state.projects.B.expenses, 100000);
  assert.equal(state.capital.frank, engine.OPENING_STATE.capital.frank + 461000);
  assert.equal(state.capital.cristian, engine.OPENING_STATE.capital.cristian + 300000);
}

// Regresion del bug de doble division: 922000 se reparte en 461000 + 461000,
// nunca en aproximadamente 231000 + 231000.
{
  const opening = {
    asOf: "2026-07-16",
    cash: 0,
    totalIncome: 0,
    totalExpenses: 0,
    profitTotal: 0,
    capitalActive: 0,
    capital: { frank: 0, cristian: 0 },
    profitAvailable: { frank: 0, cristian: 0 },
  };
  const state = calculate([
    event("capital_contribution", { project: "Bug 922", responsible: "Frank", monto: 461000 }),
    event("capital_contribution", { project: "Bug 922", responsible: "Cristian", monto: 461000 }),
  ], opening);
  assertValid(state);
  assert.equal(state.capitalActive, 922000);
  assert.equal(state.capital.frank, 461000);
  assert.equal(state.capital.cristian, 461000);
}

// Un proyecto historico puede abrirse como ejemplo sin cambiar el estado
// global de apertura; su cierre queda disponible para las nuevas operaciones.
{
  const opening = {
    asOf: "2026-07-16",
    cash: 820000,
    totalIncome: 1495000,
    totalExpenses: 675000,
    profitTotal: 820000,
    capitalActive: 820000,
    capital: { frank: 410000, cristian: 410000 },
    profitAvailable: { frank: 0, cristian: 0 },
  };
  const state = calculate(
    [event("project_close", { project: "Bote ORCHID" })],
    opening,
    {
      "Bote ORCHID": {
        income: 1495000,
        expenses: 675000,
        capital: { frank: 410000, cristian: 410000 },
        legacyCapital: 820000,
      },
    },
  );
  assertValid(state);
  assert.equal(state.projects["Bote ORCHID"].closed, true);
  assert.equal(state.capitalActive, 0);
  assert.equal(state.profitAvailable.frank, 410000);
  assert.equal(state.profitAvailable.cristian, 410000);
}

// Una compra general puede quedar sin proyecto y solo afecta al socio que paga.
{
  const before = calculate([]);
  const state = calculate([event("expense", { responsible: "Frank", monto: 1000, project: "" })]);
  assertValid(state);
  assert.equal(state.cash, before.cash - 1000);
  assert.equal(state.totalExpenses, before.totalExpenses + 1000);
  assert.equal(state.capital.frank, before.capital.frank);
  assert.equal(state.capital.cristian, before.capital.cristian);
  assert.equal(state.profitAvailable.frank, before.profitAvailable.frank);
  assert.equal(state.balanceByPartner.frank, before.balanceByPartner.frank - 1000);
  assert.equal(state.balanceByPartner.cristian, before.balanceByPartner.cristian);
}

// Una transaccion fechada el mismo dia de apertura tambien actualiza el saldo
// del responsable.
{
  const before = calculate([]);
  const state = calculate([
    event("expense", {
      fecha: "2026-07-16",
      responsible: "Cristian",
      monto: 2500,
      project: "",
    }),
  ]);
  assertValid(state);
  assert.equal(state.balanceByPartner.cristian, before.balanceByPartner.cristian - 2500);
  assert.equal(state.workingCapital.cristian, before.workingCapital.cristian - 2500);
}

console.log("finance-engine: all tests passed");
