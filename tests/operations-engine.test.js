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
const snapshot = engine.snapshotTransaction({ tipo: "gasto", monto: 50000, responsible: "Frank", descripcion: "Materiales" });
assert.equal(snapshot.originalAmount, 50000);
assert.equal(snapshot.owner, "Frank");
assert.deepEqual(
  engine.financeTotals([
    { tipo: "ingreso", monto: 120000, imported: true, originalType: "ingreso", originalAmount: 100000 },
    { tipo: "gasto", monto: 10000, imported: false },
  ], 366499),
  { income: 120000, expenses: 10000, result: 110000, available: 376499, count: 2, importedCount: 1 },
);

console.log("operations-engine: ok");
