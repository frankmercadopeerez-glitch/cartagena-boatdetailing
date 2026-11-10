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
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    focus() {}, reset() {}, close() {}, setAttribute() {},
    reportValidity: () => true,
    listeners: {},
    addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); },
    querySelector(selector) { return node(`${this.id}:${selector}`); },
    querySelectorAll() { return []; },
  });
  return nodes.get(id);
};
const document = { getElementById: node, activeElement: null, body: { style: {} }, addEventListener() {} };
let confirmed = false;
let confirmations = 0;
const context = {
  window: { CBDOperationsEngine: engine, confirm: () => { confirmations += 1; return confirmed; }, addEventListener() {} },
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
    cacheElements, installEventHandlers, defaultProject, workAccountSummary,
    renderProjectFinanceOverview, renderProjectFinanceDetail, workAccountCard,
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

  // Exercise the real renderers and input listener. Keep general movements
  // outside the main account so the profit breakdown must reconcile its rows.
  ui.cacheElements();
  ui.installEventHandlers();
  const rawProject = {
    name: "Antigone", status: "in_process", tasks: [],
    workAccounts: [
      { id: "main", title: "Trabajo principal", pendingAmount: 3050000, payableWilington: 400000, otherEstimatedCost: 630000 },
      { id: "fridge", title: "Reparar nevera", expectedIncome: 500000, otherEstimatedCost: 400000, separateWork: true, profitDeferred: true },
      { id: "stove", title: "Reparar estufa", expectedIncome: 200000, otherEstimatedCost: 150000, separateWork: true, profitDeferred: true },
    ],
  };
  ui.state.draft = ui.defaultProject(rawProject);
  const draft = ui.state.draft;
  assert.equal(draft.workAccounts[0].profitDeferred, false, "legacy accounts must remain included");
  assert.equal(draft.workAccounts[1].profitDeferred, true, "normalization preserves the pending-profit flag");
  assert.equal(JSON.parse(ui.projectDraftSnapshot())[0].workAccounts[1].profitDeferred, true, "draft snapshots retain the flag for save/discard detection");
  assert.equal(ui.defaultProject(JSON.parse(JSON.stringify(draft))).workAccounts[1].profitDeferred, true, "saved project data retains the flag on reload");
  ui.state.financeTransactions = [
    { id: "paid-main", proyecto: "Antigone", tipo: "ingreso", monto: 9500000, projectAccountId: "main" },
    { id: "spent-main", proyecto: "Antigone", tipo: "gasto", monto: 8900000, projectAccountId: "main" },
    { id: "paid-general", proyecto: "Antigone", tipo: "ingreso", monto: 100000 },
    { id: "spent-general", proyecto: "Antigone", tipo: "gasto", monto: 50000 },
  ];
  const ledgerBefore = JSON.stringify(ui.state.financeTransactions);
  const financeBefore = engine.projectFinancials(draft, ui.state.financeTransactions);
  const amountFromText = (text) => Number(text.replace(/[^0-9-]/g, ""));
  const overviewAmount = (view) => {
    const match = ui.els.projectFinanceOverview.innerHTML.match(new RegExp(`data-finance-view="${view}"[^>]*>[\\s\\S]*?<strong>([^<]+)</strong>`));
    assert.ok(match, `overview contains ${view}`);
    return amountFromText(match[1]);
  };
  const detailAmounts = () => Array.from(ui.els.projectFinanceDetailList.innerHTML.matchAll(/<b[^>]*>([^<]+)<\/b>/g), (match) => amountFromText(match[1]));
  ui.state.financeBreakdown = "";
  ui.renderProjectFinanceOverview();
  assert.equal(overviewAmount("profit"), 2670000);
  assert.equal(overviewAmount("deferredProfit"), 150000);
  assert.equal(overviewAmount("income"), 9600000);
  assert.equal(overviewAmount("expenses"), 8950000);
  assert.equal(overviewAmount("cash"), 650000);
  assert.equal(overviewAmount("receivable"), 3050000);
  assert.equal(overviewAmount("expected"), 700000);
  assert.equal(overviewAmount("wilington"), 400000);
  assert.equal(overviewAmount("other"), 1180000);

  ui.state.financeBreakdown = "profit";
  ui.renderProjectFinanceDetail();
  assert.match(ui.els.projectFinanceDetailList.innerHTML, /data-finance-account-id="main"/);
  assert.doesNotMatch(ui.els.projectFinanceDetailList.innerHTML, /data-finance-account-id="(?:fridge|stove)"/);
  assert.match(ui.els.projectFinanceDetailList.innerHTML, /Cuenta general y ajustes/);
  assert.deepEqual(detailAmounts(), [2620000, 50000]);
  assert.equal(detailAmounts().reduce((sum, amount) => sum + amount, 0), overviewAmount("profit"), "main profit breakdown reconciles unassigned movements");
  ui.state.financeBreakdown = "deferredProfit";
  ui.renderProjectFinanceDetail();
  assert.match(ui.els.projectFinanceDetailList.innerHTML, /Reparar nevera/);
  assert.match(ui.els.projectFinanceDetailList.innerHTML, /Reparar estufa/);
  assert.doesNotMatch(ui.els.projectFinanceDetailList.innerHTML, /Cuenta general y ajustes|data-finance-account-id="main"/);
  assert.deepEqual(detailAmounts(), [100000, 50000]);
  assert.equal(detailAmounts().reduce((sum, amount) => sum + amount, 0), overviewAmount("deferredProfit"));
  assert.match(ui.workAccountCard(draft.workAccounts[1]), /Profit pendiente de realizar/);
  assert.match(ui.workAccountCard(draft.workAccounts[1]), /data-account-field="profitDeferred" checked/);

  const inputHandler = ui.els.workAccountList.listeners.input[0];
  const deferredCheckbox = { checked: true };
  const accountCard = { dataset: { workAccountId: "fridge" }, querySelector: () => deferredCheckbox };
  const field = {
    dataset: { accountField: "profitDeferred" }, checked: false, value: "on",
    classList: { contains: () => false },
    closest(selector) { return selector === "[data-account-field]" ? this : accountCard; },
  };
  ui.state.savedDraftSnapshot = ui.projectDraftSnapshot();
  inputHandler({ target: field });
  assert.equal(draft.workAccounts[1].profitDeferred, false, "checkbox uses its checked boolean, not its 'on' value");
  assert.equal(ui.hasProjectChanges(), true);
  assert.equal(overviewAmount("profit"), 2770000);
  assert.equal(overviewAmount("deferredProfit"), 50000);
  field.checked = true;
  inputHandler({ target: field });
  assert.equal(overviewAmount("profit"), 2670000);

  for (const status of ["delivered", "warranty", "closed"]) {
    draft.workAccounts[1].profitDeferred = true;
    deferredCheckbox.checked = true;
    field.dataset.accountField = "status";
    field.value = status;
    inputHandler({ target: field });
    assert.equal(draft.workAccounts[1].profitDeferred, false, `${status} integrates the service profit`);
    assert.equal(deferredCheckbox.checked, false);
    assert.match(ui.els.toast.textContent, /profit se integra/);
    assert.equal(overviewAmount("profit"), 2770000);
    assert.equal(overviewAmount("deferredProfit"), 50000);
  }
  draft.workAccounts[2].profitDeferred = false;
  ui.renderProjectFinanceOverview();
  assert.equal(overviewAmount("profit"), 2820000);
  assert.doesNotMatch(ui.els.projectFinanceOverview.innerHTML, /data-finance-view="deferredProfit"/);
  assert.deepEqual(engine.projectFinancials(draft, ui.state.financeTransactions), financeBefore, "profit classification must not alter the ledger or cash");
  assert.equal(JSON.stringify(ui.state.financeTransactions), ledgerBefore);
  console.log("Operations UI regression checks passed");
}

run().catch((error) => { console.error(error); process.exitCode = 1; });
