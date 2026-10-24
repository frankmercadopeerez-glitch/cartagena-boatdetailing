const crypto = require("node:crypto");
const { getFirestore, requireOperationsUser } = require("../../_lib/firebase-admin");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido." });
  }
  try {
    const user = await requireOperationsUser(req);
    const { subscription, platform } = req.body || {};
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ error: "La suscripción del dispositivo no es válida." });
    }
    const deviceId = crypto.createHash("sha256").update(subscription.endpoint).digest("hex").slice(0, 48);
    await getFirestore().collection("notificaciones_dispositivos_operaciones").doc(`${user.uid}_${deviceId}`).set({
      uid: user.uid,
      email: user.email || "",
      subscription: { endpoint: subscription.endpoint, keys: subscription.keys },
      platform: String(platform || "").slice(0, 500),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("operations-push-subscribe", error);
    return res.status(error.statusCode || 500).json({ error: error.message || "No se pudo registrar el dispositivo." });
  }
};
