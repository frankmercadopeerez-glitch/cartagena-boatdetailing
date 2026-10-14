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

const merged = engine.mergeProjects(projects, [
  { name: "Bote Firulays", financeProjectName: "Bote Firulays", scope: "Pulido integral" },
  { name: "Trabajo independiente", status: "in_process" },
]);
assert.equal(merged.length, 3);
assert.equal(merged.find((item) => item.name === "Bote Firulays").scope, "Pulido integral");

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
  { contractValue: 5400000, ledgerPaid: 2699985, paid: 2699985, pending: 2700015, expenses: 106000, releasedProfit: 500000, balance: 2093985, frankPotential: 1046992.5 },
);

assert.deepEqual(
  engine.projectFinancials(
    { name: "Yate Haya", contractValue: 16160900, paidOpening: 4250000, paidOpeningLedger: 1025000 },
    [{ tipo: "ingreso", monto: 1225000, proyecto: "Yate Haya" }],
  ),
  { contractValue: 16160900, ledgerPaid: 1225000, paid: 4450000, pending: 11710900, expenses: 0, releasedProfit: 0, balance: 4450000, frankPotential: 2225000 },
);

assert.deepEqual(
  engine.financeTotals(
    [{ tipo: "gasto", monto: 100000, categoria: "Retiro de Profit", imported: true, originalType: "gasto", originalAmount: 100000, originalCategory: "Materiales / Insumos" }],
    { openingBalance: 4000000, sourceTotalIncome: 57289510, sourceTotalExpenses: 40830467, sourceProfitTotal: 17800918 },
  ),
  { income: 57289510, expenses: 40730467, result: 17900918, profit: 17900918, frankProfit: 8950459, releasedProfit: 0, available: 4000000, count: 1, importedCount: 1 },
);

console.log("operations-engine: ok");
