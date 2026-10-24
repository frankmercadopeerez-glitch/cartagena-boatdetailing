const crypto = require("node:crypto");
const { getFirestore, requireOperationsUser } = require("../../_lib/firebase-admin");

function cleanReminder(reminder = {}) {
  return {
    id: String(reminder.id || "").slice(0, 160),
    type: ["purchase", "payment", "general"].includes(reminder.type) ? reminder.type : "general",
    title: String(reminder.title || "").trim().slice(0, 240),
    dueDate: /^\d{4}-\d{2}-\d{2}$/.test(reminder.dueDate || "") ? reminder.dueDate : "",
    amount: Math.max(0, Number(reminder.amount) || 0),
    alertDays: Math.min(30, Math.max(0, Number(reminder.alertDays) || 0)),
    done: reminder.done === true,
  };
}

function cleanProject(project = {}) {
  return {
    projectKey: String(project.projectKey || "").trim().slice(0, 180),
    projectName: String(project.projectName || "").trim().slice(0, 180),
    reminders: Array.isArray(project.reminders)
      ? project.reminders.map(cleanReminder).filter((item) => item.id && item.title && item.dueDate).slice(0, 200)
      : [],
  };
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido." });
  }
  try {
    const user = await requireOperationsUser(req);
    const projects = (Array.isArray(req.body?.projects) ? req.body.projects : []).map(cleanProject).filter((item) => item.projectKey && item.projectName).slice(0, 100);
    const replace = req.body?.replace === true;
    const db = getFirestore();
    const batch = db.batch();
    const keep = new Set();
    projects.forEach((project) => {
      const id = crypto.createHash("sha256").update(`${user.uid}:${project.projectKey}`).digest("hex");
      keep.add(id);
      batch.set(db.collection("notificaciones_recordatorios_operaciones").doc(id), {
        uid: user.uid,
        email: user.email || "",
        ...project,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    });
    if (replace) {
      const existing = await db.collection("notificaciones_recordatorios_operaciones").where("uid", "==", user.uid).get();
      existing.docs.forEach((doc) => {
        if (!keep.has(doc.id)) batch.delete(doc.ref);
      });
    }
    await batch.commit();
    return res.status(200).json({ ok: true, projects: projects.length });
  } catch (error) {
    console.error("operations-push-sync", error);
    return res.status(error.statusCode || 500).json({ error: error.message || "No se pudo sincronizar la agenda." });
  }
};
