const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const engine = require("../js/operations-engine.js");

// Run the actual UI handlers against in-memory controls; no Firebase or browser session.
const source = fs.readFileSync(path.join(__dirname, "../js/operaciones.js"), "utf8");
const nodes = new Map();
const node = (id) => {
  if (!nodes.has(id)) nodes.set(id, {
    id, value: "", disabled: false, textContent: "", elements: [],
    classList: { add() {}, remove() {}, toggle() {} },
    focus() {}, reset() {}, close() {}, setAttribute() {},
    reportValidity: () => true,
  });
  return nodes.get(id);
};
const document = { getElementById: node, activeElement: null, body: { style: {} } };
let confirmed = false;
let confirmations = 0;
const context = {
  window: { CBDOperationsEngine: engine, confirm: () => { confirmations += 1; return confirmed; } },
  document, console, Intl, Date, URL,
  navigator: { onLine: true },
  setTimeout: () => 1, clearTimeout() {},
  firebase: { firestore: { FieldValue: { serverTimestamp: () => "test-timestamp" } } },
};
vm.createContext(context);
vm.runInContext(source.replace(/  init\(\);\s*\}\)\(\);\s*$/, `
  globalThis.testUi = {
    state, els, keepMoneyFormatted, projectDraftSnapshot, hasProjectChanges,
    closeProject, createProject, deleteFinanceMovement, filteredFinanceTransactions,
    workAccountTransactions, updateDataSyncStatus, saveFinanceMovement,
  };
})();`), context);
const ui = context.testUi;
assert.ok(ui, "UI test exposure must replace init without starting Firebase");
Object.assign(ui.els, {
  toast: node("toast"), projectDrawer: node("drawer"), drawerBackdrop: node("backdrop"),
  appShell: node("shell"), newProjectModal: node("new-modal"), newProjectForm: node("new-form"),
  newContractValue: node("new-contract-value"), financeId: node("finance-id"),
  financeModal: node("finance-modal"), financeForm: node("finance-form"),
  deleteFinanceButton: node("delete-finance"), saveFinanceButton: node("save-finance"),
  syncPill: node("sync-pill"),
  reminderTitle: node("reminder-title"),
  financeType: node("finance-type"), financeAmount: node("finance-amount"),
  financeDate: node("finance-date"), financeTime: node("finance-time"), financeCategory: node("finance-category"),
  financeProject: node("finance-project"), financeAccount: node("finance-account"),
  financeAccountWrap: node("finance-account-wrap"), financeDescription: node("finance-description"),
});

const input = { value: "192.345", selectionStart: 2, setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; } };
document.activeElement = input;
ui.keepMoneyFormatted(input);
assert.equal(input.selectionStart, 2, "editing a formatted amount must not move the cursor");
input.value = "1923.456";
input.selectionStart = 2;
ui.keepMoneyFormatted(input);
assert.equal(input.value, "1.923.456");
assert.equal(input.selectionStart, 3, "caret follows the typed digit when thousands separators change");

ui.state.draft = { name: "Antigone", tasks: [] };
node("project-form").elements = [node("notes")];
ui.state.savedDraftSnapshot = ui.projectDraftSnapshot();
assert.equal(ui.hasProjectChanges(), false);
node("notes").value = "Texto sin guardar";
assert.equal(ui.hasProjectChanges(), true);
assert.equal(ui.closeProject(), false, "canceling discard must keep the draft");
assert.equal(ui.state.draft.name, "Antigone");
assert.equal(confirmations, 1);
confirmed = true;
assert.equal(ui.closeProject(), true);
assert.equal(ui.state.draft, null);
assert.equal(ui.els.projectDrawer.inert, true, "closed drawer must not receive keyboard focus");
ui.state.draft = { name: "Antigone", tasks: [] };
ui.state.savedDraftSnapshot = ui.projectDraftSnapshot();
ui.els.reminderTitle.value = "Aviso escrito sin pulsar Agregar";
assert.equal(ui.hasProjectChanges(), true, "a not-yet-added reminder must also be protected on close");
ui.els.reminderTitle.value = "";
assert.equal(ui.hasProjectChanges(), false);
ui.state.draft = null;

async function run() {
  let writes = 0;
  let rejectWrite;
  ui.state.user = { uid: "test-user", email: "test@example.invalid" };
  ui.state.db = { collection: () => ({ doc: () => ({ set: () => {
    writes += 1;
    return new Promise((resolve, reject) => { rejectWrite = reject; });
  } }) }) };
  node("new-name").value = "Trabajo de prueba";
  node("new-deadline").value = "2026-11-10";
  node("new-scope").value = "Pintura";
  const event = { preventDefault() {} };
  const first = ui.createProject(event);
  await ui.createProject(event);
  assert.equal(writes, 1, "double-tapping create must not write two projects");
  assert.equal(node("create-project-button").disabled, true);
  const originalError = context.console;
  context.console = { error() {} };
  rejectWrite(new Error("Simulated connection failure"));
  await first;
  context.console = originalError;
  assert.equal(ui.state.creatingProject, false);
  assert.equal(node("create-project-button").disabled, false, "failed save can be retried");
  assert.equal(node("new-name").value, "Trabajo de prueba", "failed save must retain the user's input");

  ui.state.projects = [{ name: "Antigone", workAccounts: [] }];
  ui.state.draft = { name: "Antigone", workAccounts: [{ id: "unsaved-service", title: "Servicio aún sin guardar" }] };
  ui.els.financeType.value = "gasto";
  ui.els.financeAmount.value = "40.000";
  ui.els.financeDate.value = "2026-11-04";
  ui.els.financeCategory.value = "Materiales / Insumos";
  ui.els.financeProject.value = "Antigone";
  ui.els.financeAccount.value = "unsaved-service";
  ui.els.financeAccountWrap.hidden = false;
  await ui.saveFinanceMovement(event);
  assert.equal(writes, 1, "choosing an unsaved service from the generic movement dropdown must not write an orphan");
  assert.match(ui.els.toast.textContent, /Primero guarda el servicio/);
  assert.equal(ui.els.financeAmount.value, "40.000", "validation must retain the entered movement");
  ui.state.draft = null;

  let archived;
  let physicallyDeleted = false;
  ui.state.db = { collection: () => ({ doc: () => ({
    set: async (payload) => { archived = payload; },
    delete: async () => { physicallyDeleted = true; },
  }) }) };
  ui.state.financeTransactions = [
    { id: "historical", tipo: "gasto", monto: 40000, imported: true, originalMonto: 40000 },
    { id: "active", tipo: "ingreso", monto: 100000 },
  ];
  ui.els.financeId.value = "historical";
  await ui.deleteFinanceMovement();
  assert.equal(archived.archived, true, "historical deletes must retain the baseline record for totals");
  assert.equal(physicallyDeleted, false);
  ui.state.financeTransactions[0].archived = true;
  assert.deepEqual(Array.from(ui.filteredFinanceTransactions(), (record) => record.id), ["active"]);

  ui.state.financeTransactions = [
    { id: "one", proyecto: "Antigone", projectAccountId: "paint-one", projectAccountName: "Pintura", monto: 100 },
    { id: "two", proyecto: "Antigone", projectAccountId: "paint-two", projectAccountName: "Pintura", monto: 200 },
  ];
  assert.deepEqual(Array.from(ui.workAccountTransactions({ name: "Antigone" }, { id: "paint-one", title: "Pintura" }), (record) => record.id), ["one"], "a name match must not override an explicit different service ID");

  ui.state.financeReady = ui.state.operationsReady = true;
  ui.state.snapshotMeta = { finance: { fromCache: false, hasPendingWrites: false }, operations: { fromCache: false, hasPendingWrites: false } };
  ui.updateDataSyncStatus();
  assert.match(ui.els.syncPill.innerHTML, /Portal al día/);
  ui.state.dataErrors.add("datos operativos");
  ui.updateDataSyncStatus();
  assert.doesNotMatch(ui.els.syncPill.innerHTML, /Portal al día/);
  ui.state.dataErrors.clear();
  ui.state.snapshotMeta.operations.fromCache = true;
  ui.updateDataSyncStatus();
  assert.match(ui.els.syncPill.innerHTML, /Verificando conexión/);
  context.navigator.onLine = false;
  ui.updateDataSyncStatus();
  assert.match(ui.els.syncPill.innerHTML, /Sin conexión/);
  console.log("Operations UI regression checks passed");
}

run().catch((error) => { console.error(error); process.exitCode = 1; });
