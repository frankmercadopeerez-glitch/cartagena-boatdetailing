const crypto = require("node:crypto");
const { getFirestore } = require("../_lib/firebase-admin");
const { getWebPush } = require("../_lib/web-push");

function colombiaDateParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type) => parts.find((value) => value.type === type).value;
  return { year: Number(part("year")), month: Number(part("month")), day: Number(part("day")) };
}

function isoDate(value) {
  return `${value.year}-${String(value.month).padStart(2, "0")}-${String(value.day).padStart(2, "0")}`;
}

function parseDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  return match ? { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) } : null;
}

function daysBetween(from, to) {
  return Math.round((Date.UTC(to.year, to.month - 1, to.day) - Date.UTC(from.year, from.month - 1, from.day)) / 86400000);
}

function reminderTypeLabel(type) {
  return type === "purchase" ? "Compra" : type === "payment" ? "Pago" : type === "deadline" ? "Fecha límite" : "Aviso";
}

function money(value) {
  return Number(value) > 0 ? ` · $ ${Number(value).toLocaleString("es-CO")}` : "";
}

module.exports = async (req, res) => {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "No autorizado." });
  }
  try {
    const db = getFirestore();
    const today = colombiaDateParts();
    const todayIso = isoDate(today);
    const [schedulesSnapshot, devicesSnapshot] = await Promise.all([
      db.collection("notificaciones_recordatorios_operaciones").get(),
      db.collection("notificaciones_dispositivos_operaciones").get(),
    ]);
    const devicesByUid = new Map();
    devicesSnapshot.docs.forEach((device) => {
      const uid = device.data().uid;
      if (!devicesByUid.has(uid)) devicesByUid.set(uid, []);
      devicesByUid.get(uid).push(device);
    });
    const webpush = getWebPush();
    let remindersSent = 0;

    for (const scheduleDoc of schedulesSnapshot.docs) {
      const schedule = scheduleDoc.data();
      const devices = devicesByUid.get(schedule.uid) || [];
      if (!devices.length) continue;
      for (const reminder of schedule.reminders || []) {
        if (reminder.done) continue;
        const due = parseDate(reminder.dueDate);
        if (!due) continue;
        const daysUntil = daysBetween(today, due);
        const alertDays = Math.max(0, Number(reminder.alertDays) || 0);
        if (daysUntil < 0 || daysUntil > alertDays) continue;
        const dedupeId = crypto.createHash("sha256").update(`${todayIso}:${scheduleDoc.id}:${reminder.id}`).digest("hex");
        const sentRef = db.collection("notificaciones_envios_operaciones").doc(dedupeId);
        if ((await sentRef.get()).exists) continue;
        const when = daysUntil === 0 ? "para hoy" : daysUntil === 1 ? "para mañana" : `en ${daysUntil} días`;
        const payload = JSON.stringify({
          title: `${reminderTypeLabel(reminder.type)} · ${schedule.projectName || "CBD Operaciones"}`,
          body: `${reminder.title}${money(reminder.amount)} · ${when}.`,
          url: "/operaciones.html",
          tag: `cbd-${scheduleDoc.id}-${reminder.id}`,
        });
        const deliveries = await Promise.allSettled(devices.map(async (device) => {
          try {
            await webpush.sendNotification(device.data().subscription, payload, { TTL: 86400 });
          } catch (error) {
            if (error.statusCode === 404 || error.statusCode === 410) await device.ref.delete();
            throw error;
          }
        }));
        const delivered = deliveries.filter((item) => item.status === "fulfilled").length;
        if (!delivered) continue;
        await sentRef.set({ uid: schedule.uid, projectKey: schedule.projectKey, reminderId: reminder.id, date: todayIso, sentAt: new Date().toISOString(), delivered });
        remindersSent += 1;
      }
    }
    return res.status(200).json({ ok: true, remindersSent, date: todayIso, deliveryTime: "08:00", timeZone: "America/Bogota" });
  } catch (error) {
    console.error("operations-reminder-cron", error);
    return res.status(500).json({ error: error.message || "No se pudieron revisar las alertas." });
  }
};
