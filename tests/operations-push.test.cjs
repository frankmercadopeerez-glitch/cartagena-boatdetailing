const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const notifications = [];
const writes = [];
const deleted = [];
const doc = (id, data) => ({
  id,
  data: () => data,
  ref: { delete: async () => deleted.push(id), set: async (value) => writes.push([id, value]) },
});
const collections = {
  notificaciones_recordatorios_operaciones: [
    doc("antigone", { uid: "frank", projectKey: "velero-antigone", projectName: "Velero Antigone", reminders: [
      { id: "nevera", type: "general", title: "Revisar nevera", dueDate: "2026-10-25", alertDays: 0, done: false },
      { id: "estufa", type: "general", title: "Revisar estufa", dueDate: "2026-10-25", alertDays: 0, done: false },
      { id: "terminado", type: "general", title: "No enviar", dueDate: "2026-10-25", alertDays: 0, done: true },
    ] }),
  ],
  notificaciones_dispositivos_operaciones: [
    doc("phone", { uid: "frank", subscription: { endpoint: "https://push.example", keys: { p256dh: "a", auth: "b" } } }),
  ],
};
const snapshot = (name) => ({ docs: collections[name] || [], empty: !(collections[name] || []).length });
const db = {
  collection(name) {
    return {
      get: async () => snapshot(name),
      doc: (id) => ({
        get: async () => ({ exists: false }),
        set: async (value) => writes.push([id, value]),
      }),
    };
  },
};

const moduleUnderTest = { exports: {} };
const RealDate = Date;
class TestDate extends RealDate {
  constructor(...args) { super(...(args.length ? args : ["2026-10-25T13:00:00Z"])); }
}

vm.runInNewContext(fs.readFileSync("api/cron/operaciones.js", "utf8"), {
  require: (path) => path === "node:crypto" ? require("node:crypto") : path.includes("firebase-admin")
    ? { getFirestore: () => db }
    : { getWebPush: () => ({ sendNotification: async (subscription, payload) => notifications.push([subscription, JSON.parse(payload)]) }) },
  module: moduleUnderTest,
  console,
  Intl,
  Date: TestDate,
  Number,
  Math,
  Promise,
  Map,
  JSON,
  process: { env: { CRON_SECRET: "secret" } },
});

const response = {
  status(code) { this.statusCode = code; return this; },
  json(value) { this.body = value; return value; },
};

moduleUnderTest.exports({ headers: { authorization: "Bearer secret" } }, response).then(() => {
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.remindersSent, 2);
  assert.equal(notifications.length, 2, "envía nevera y estufa aunque la PWA esté cerrada");
  assert.match(notifications.map((item) => item[1].body).join("\n"), /Revisar nevera/);
  assert.match(notifications.map((item) => item[1].body).join("\n"), /Revisar estufa/);
  assert.equal(writes.length, 2, "deduplica cada recordatorio enviado");
  assert.equal(deleted.length, 0);
  console.log("operations push scheduling: ok");
});
