const assert = require("node:assert/strict");
const engine = require("../js/operations-engine.js");

const transactions = [
  { proyecto: "Bote Firulays", tipo: "ingreso", monto: 1300000, fecha: "2026-10-01" },
  { proyecto: "Bote Firulays", tipo: "gasto", monto: 865000, fecha: "2026-10-02" },
  { proyecto: "Yate Haya", tipo: "ingreso", monto: 1025000, fecha: "2026-10-03" },
  { proyecto: "Publicidad", tipo: "gasto", monto: 120000, fecha: "2026-10-04" },
  { proyecto: "Publicidad semanal", tipo: "gasto", monto: 80000, fecha: "2026-10-04" },
  { proyecto: "Botes Zodiac", tipo: "ingreso", monto: 6000000, fecha: "2026-10-05", archived: true },
  { proyecto: "Bote Cerrado", tipo: "ingreso", monto: 2000000, fecha: "2026-09-01" },
  { project: "Bote Cerrado", proyecto: "Bote Cerrado", motorType: "project_close", descripcion: "Cierre definitivo de proyecto", fecha: "2026-09-02" },
];

const projects = engine.deriveFinanceProjects(transactions, {});
assert.deepEqual(projects.map((item) => item.name), ["Bote Firulays", "Yate Haya"]);
assert.equal(projects[0].balance, 435000);
assert.equal(engine.slugify("Yate Le Merediet"), "yate-le-merediet");
assert.equal(engine.taskProgress([{ done: true }, { done: false }], 0), 50);
assert.equal(engine.urgencyFor({ deadline: "2026-10-13", tasks: [], reminders: [] }, "2026-10-14"), "late");
assert.equal(engine.urgencyFor({ deadline: "2026-10-16", tasks: [], reminders: [] }, "2026-10-14"), "attention");
assert.equal(engine.urgencyFor({ status: "in_process", deadline: "", location: "", contractValue: 0, scope: "", tasks: [], reminders: [] }, "2026-10-14"), "attention");
assert.deepEqual(
  engine.projectIssues({ status: "in_process", deadline: "", location: "", contractValue: 0, scope: "", tasks: [], reminders: [] }, "2026-10-14").map((issue) => issue.code),
  ["missing_deadline", "missing_contract", "missing_scope", "missing_checklist"],
);
assert.deepEqual(engine.projectDeadlineReminder({ status: "in_process", deadline: "2026-10-27" }), {
  id: "project-deadline", type: "deadline", title: "Fecha límite del trabajo", dueDate: "2026-10-27", amount: 0, alertDays: 2, done: false,
});
assert.equal(engine.projectDeadlineReminder({ status: "completed", deadline: "2026-10-27" }), null);
assert.equal(engine.projectIssues({ status: "completed", deadline: "2026-10-01", tasks: [], reminders: [] }, "2026-10-14").some((issue) => issue.code === "late_deadline"), false);
assert.equal(
  engine.projectIssues({ status: "completed", deadline: "", location: "", contractValue: 1, scope: "Listo", tasks: [{ done: false }], reminders: [] }, "2026-10-14")[0].code,
  "completed_open_tasks",
);

const merged = engine.mergeProjects(projects, [
  { name: "Bote Firulays", financeProjectName: "Bote Firulays", scope: "Pulido integral" },
  { name: "Trabajo independiente", status: "in_process" },
  { name: "Trabajo terminado", status: "completed" },
  { name: "Trabajo archivado", status: "completed", archived: true },
]);
assert.equal(merged.length, 4);
assert.equal(merged.find((item) => item.name === "Bote Firulays").scope, "Pulido integral");
assert.equal(merged.find((item) => item.name === "Trabajo terminado").status, "completed");
assert.equal(merged.some((item) => item.name === "Trabajo archivado"), false);

assert.equal(engine.isFrankBusinessTransaction({ tipo: "ingreso", monto: 100, receptor: "Frank" }), true);
assert.equal(engine.isFrankBusinessTransaction({ tipo: "gasto", monto: 100, responsible: "Cristian" }), false);
assert.equal(engine.isFrankBusinessTransaction({ tipo: "ingreso", monto: 100, receptor: "Frank", categoria: "Aporte de Capital" }), false);
assert.equal(engine.isBusinessTransaction({ tipo: "ingreso", monto: 100, receptor: "Cristian" }), true);
const snapshot = engine.snapshotTransaction({ tipo: "gasto", monto: 50000, responsible: "Frank", descripcion: "Materiales" });
assert.equal(snapshot.originalAmount, 50000);
assert.equal(snapshot.owner, "Frank");
assert.deepEqual(
  engine.financeTotals([
    { tipo: "ingreso", monto: 120000, imported: true, originalType: "ingreso", originalAmount: 100000 },
    { tipo: "gasto", monto: 10000, imported: false },
  ], { openingBalance: 366499 }),
  { income: 120000, expenses: 10000, result: 110000, profit: 110000, frankProfit: 55000, releasedProfit: 0, available: 376499, count: 2, importedCount: 1 },
);
assert.deepEqual(
  engine.financeTotals([
    { tipo: "ingreso", monto: 120000, imported: true, originalType: "ingreso", originalAmount: 100000 },
    { tipo: "gasto", monto: 10000, imported: false },
  ], { openingBalance: 366499, sourceTotalIncome: 57289510, sourceTotalExpenses: 40830467, sourceProfitTotal: 17800918 }),
  { income: 57309510, expenses: 40840467, result: 17810918, profit: 17810918, frankProfit: 8905459, releasedProfit: 0, available: 376499, count: 2, importedCount: 1 },
);

assert.deepEqual(
  engine.financeTotals([
    { tipo: "gasto", monto: 3800000, categoria: "Retiro de Profit", imported: false },
    { tipo: "gasto", monto: 200000, categoria: "Materiales / Insumos", imported: false },
    { tipo: "gasto", monto: 100000, categoria: "Retiro de Profit", imported: false, releasedProjectProfit: 900000 },
  ], { openingBalance: 4000000, sourceTotalIncome: 57289510, sourceTotalExpenses: 40830467, sourceProfitTotal: 17800918 }),
  { income: 57289510, expenses: 41030467, result: 18500918, profit: 18500918, frankProfit: 9250459, releasedProfit: 900000, available: -100000, count: 3, importedCount: 0 },
);

assert.deepEqual(
  engine.projectFinancials(
    { name: "Yate Le Merediet", contractValue: 5400000 },
    [
      { tipo: "ingreso", monto: 2699985, proyecto: "Yate Le Merediet" },
      { tipo: "gasto", monto: 106000, categoria: "Materiales / Insumos", proyecto: "Yate Le Merediet" },
      { tipo: "gasto", monto: 100000, categoria: "Retiro de Profit", proyecto: "Yate Le Merediet", releasedProjectProfit: 500000 },
    ],
  ),
  { contractValue: 5400000, nextPaymentAmount: 0, ledgerPaid: 2699985, paid: 2699985, pending: 2700015, expenses: 106000, releasedProfit: 500000, balance: 2093985, frankPotential: 1046992.5 },
);

assert.deepEqual(
  engine.projectFinancials(
    { name: "Yate Haya", contractValue: 1625000 },
    [{ tipo: "ingreso", monto: 1025000, proyecto: "Yate Haya" }],
  ),
  { contractValue: 1625000, nextPaymentAmount: 0, ledgerPaid: 1025000, paid: 1025000, pending: 600000, expenses: 0, releasedProfit: 0, balance: 1025000, frankPotential: 512500 },
);

assert.deepEqual(
  engine.projectFinancials(
    { name: "Botes Zodiac", contractValue: 33000000, nextPaymentAmount: 8000000 },
    [{ tipo: "ingreso", monto: 8000000, proyecto: "Botes Zodiac" }],
  ),
  { contractValue: 33000000, nextPaymentAmount: 8000000, ledgerPaid: 8000000, paid: 8000000, pending: 25000000, expenses: 0, releasedProfit: 0, balance: 8000000, frankPotential: 4000000 },
);

assert.deepEqual(
  engine.financeTotals(
    [{ tipo: "gasto", monto: 100000, categoria: "Retiro de Profit", imported: true, originalType: "gasto", originalAmount: 100000, originalCategory: "Materiales / Insumos" }],
    { openingBalance: 4000000, sourceTotalIncome: 57289510, sourceTotalExpenses: 40830467, sourceProfitTotal: 17800918 },
  ),
  { income: 57289510, expenses: 40730467, result: 17900918, profit: 17900918, frankProfit: 8950459, releasedProfit: 0, available: 4000000, count: 1, importedCount: 1 },
);

// Archivar una fila importada revierte el valor original incluido en el corte,
// incluso si después fue editada, cambió de tipo o liberó profit.
const importedDeletionMeta = { openingBalance: 80000, sourceTotalIncome: 100000, sourceTotalExpenses: 20000, sourceProfitTotal: 80000 };
const deletedIncome = { tipo: "gasto", monto: 60000, categoria: "Retiro de Profit", imported: true, originalType: "ingreso", originalAmount: 100000, originalCategory: "Otros Ingresos", releasedProjectProfit: 30000, archived: true };
const remainingExpense = { tipo: "gasto", monto: 20000, categoria: "Materiales", imported: true, originalType: "gasto", originalAmount: 20000, originalCategory: "Materiales" };
assert.deepEqual(engine.financeTotals([deletedIncome, remainingExpense], importedDeletionMeta), {
  income: 0, expenses: 20000, result: -20000, profit: -20000, frankProfit: -10000,
  releasedProfit: 0, available: -20000, count: 1, importedCount: 1,
});
assert.deepEqual(engine.financeTotals([
  { tipo: "ingreso", monto: 100000, imported: true, originalType: "ingreso", originalAmount: 100000 },
  { ...remainingExpense, monto: 50000, archived: true },
  { tipo: "gasto", monto: 9000, archived: true },
], importedDeletionMeta), {
  income: 100000, expenses: 0, result: 100000, profit: 100000, frankProfit: 50000,
  releasedProfit: 0, available: 100000, count: 1, importedCount: 1,
});
assert.equal(engine.projectFinancials({ name: "Prueba", contractValue: 100000 }, [
  { ...deletedIncome, proyecto: "Prueba" },
]).ledgerPaid, 0);

// El pago conciliado incluye un ajuste de 20k sobre los 80k del libro al corte.
// Ese ajuste permanece al corregir/borrar el ingreso y al añadir pagos nuevos.
const reconciledProject = { name: "Conciliado", contractValue: 200000, paidOpening: 100000, paidOpeningLedger: 80000 };
const reconciledIncome = { tipo: "ingreso", monto: 80000, proyecto: "Conciliado" };
assert.equal(engine.projectFinancials(reconciledProject, [reconciledIncome]).paid, 100000);
const correctedPayment = engine.projectFinancials(reconciledProject, [{ ...reconciledIncome, monto: 50000 }]);
assert.equal(correctedPayment.paid, 70000);
assert.equal(correctedPayment.pending, 130000);
assert.equal(engine.projectFinancials(reconciledProject, [{ ...reconciledIncome, archived: true }]).paid, 20000);
const additionalPayment = engine.projectFinancials(reconciledProject, [reconciledIncome, { ...reconciledIncome, monto: 30000 }]);
assert.equal(additionalPayment.paid, 130000);
assert.equal(additionalPayment.pending, 70000);
assert.equal(engine.projectFinancials({ ...reconciledProject, paidOpening: 50000 }, []).paid, 0);

// El profit de servicios aún pendientes se separa sin cambiar caja ni el total.
const antigoneFinance = Object.freeze({ paid: 9600000, expenses: 8950000, balance: 650000 });
const antigoneAccounts = [
  Object.freeze({ income: 9600000, expenses: 8950000, pending: 3050000, payableWilington: 400000, otherEstimatedCost: 630000 }),
  Object.freeze({ expectedIncome: 500000, otherEstimatedCost: 400000, profitDeferred: true }),
  Object.freeze({ expectedIncome: 200000, otherEstimatedCost: 150000, profitDeferred: true }),
];
assert.deepEqual(engine.splitWorkProfit(antigoneFinance, antigoneAccounts), {
  total: 2820000, current: 2670000, deferred: 150000, deferredCount: 2,
});
assert.deepEqual(engine.splitWorkProfit(antigoneFinance, antigoneAccounts.map((account) => ({ ...account, profitDeferred: false }))), {
  total: 2820000, current: 2820000, deferred: 0, deferredCount: 0,
}, "realizar los trabajos incorpora el margen, sin inventar nuevos ingresos ni gastos");
assert.deepEqual(engine.splitWorkProfit(antigoneFinance, antigoneAccounts.map(({ profitDeferred, ...legacy }) => legacy)), {
  total: 2820000, current: 2820000, deferred: 0, deferredCount: 0,
}, "los servicios anteriores sin marca conservan su comportamiento");

// Un anticipo o gasto real de un servicio diferido sigue formando parte de su
// margen completo; los movimientos generales permanecen en el profit principal.
assert.deepEqual(engine.splitWorkProfit({ paid: 1000000, expenses: 450000 }, [
  { income: 300000, expenses: 250000, pending: 200000, otherEstimatedCost: 100000, profitDeferred: true },
]), { total: 650000, current: 500000, deferred: 150000, deferredCount: 1 });
assert.deepEqual(engine.splitWorkProfit({ paid: 100000, expenses: 300000 }, [
  { income: 100000, expenses: 300000, pending: 50000, otherEstimatedCost: 100000, profitDeferred: true },
]), { total: -250000, current: 0, deferred: -250000, deferredCount: 1 }, "una pérdida prevista no se oculta ni se recorta a cero");
assert.deepEqual(engine.splitWorkProfit({ paid: 100000, expenses: 300000 }, []), {
  total: -200000, current: -200000, deferred: 0, deferredCount: 0,
});
assert.deepEqual(antigoneFinance, { paid: 9600000, expenses: 8950000, balance: 650000 }, "el desglose no altera los datos de caja");

console.log("operations-engine: ok");
