const assert = require("assert");
const engine = require("../js/finance-engine.js");

function calculate(events, opening) {
  return engine.calculate({
    transactions: events,
    opening: opening || engine.OPENING_STATE,
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
  assert.equal(state.totalExpenses, 12548959);
  assert.equal(state.profitTotal, 7138551);
  assert.equal(state.capitalActive, 1742000);
  assert.equal(Math.round(state.capital.frank), 1053500);
  assert.equal(Math.round(state.capital.cristian), 688501);
  assertValid(state);
}

// Aporte, ingreso y gasto: solo cambia caja en ingresos/gastos; el capital
// solo cambia con el aporte y el otro socio permanece intacto.
{
  const state = calculate([
    event("capital_contribution", { project: "Orchid", responsible: "Frank", monto: 1500000 }),
    event("income", { project: "Orchid", monto: 5000000 }),
    event("expense", { project: "Orchid", responsible: "Frank", monto: 2000000 }),
  ]);
  assertValid(state);
  assert.equal(state.capital.frank, 2553499.5);
  assert.equal(state.capital.cristian, 688500.5);
  assert.equal(state.profitAvailable.frank, 1357568.5);
  assert.equal(state.profitAvailable.cristian, 1357568.5);
  assert.equal(state.cash, 8957137);
  assert.equal(state.totalIncome, 26429510);
  assert.equal(state.totalExpenses, 14548959);
}

// Cierre: libera el capital del proyecto y pasa su utilidad al profit 50/50.
{
  const state = calculate([
    event("capital_contribution", { id: "aporte-orchid", project: "Orchid", responsible: "Frank", monto: 1500000 }),
    event("income", { project: "Orchid", monto: 5000000 }),
    event("expense", { project: "Orchid", responsible: "Cristian", monto: 2000000 }),
    event("project_close", { id: "cierre-orchid", project: "Orchid", split: { frank: 0.5, cristian: 0.5 } }),
  ]);
  assertValid(state);
  assert.equal(state.capitalActive, 1742000);
  assert.equal(state.capital.frank, 1053499.5);
  assert.equal(state.profitAvailable.frank, 2857568.5);
  assert.equal(state.profitAvailable.cristian, 2857568.5);
  assert.equal(state.projects.Orchid.closed, true);
  assert.equal(state.projects.Orchid.profit, 3000000);
}

// Retiro de profit: solo toca caja y el profit del socio que retira.
{
  const before = calculate([]);
  const state = calculate([event("profit_withdrawal", { responsible: "Frank", monto: 500000 })]);
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
    event("income", { project: "A", monto: 1000000 }),
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

// Un gasto incompleto no puede convertirse en un estado financiero guardado.
{
  const state = calculate([event("expense", { responsible: "Frank", monto: 1000, project: "" })]);
  assert.equal(state.validation.valid, false);
  assert.equal(state.validation.errors[0].code, "PROJECT_REQUIRED");
}

console.log("finance-engine: all tests passed");
