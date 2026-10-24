module.exports = (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método no permitido." });
  }
  const publicKey = process.env.WEB_PUSH_PUBLIC_KEY;
  res.setHeader("Cache-Control", "no-store");
  if (!publicKey) return res.status(503).json({ enabled: false, error: "Las alertas aún no están configuradas." });
  return res.status(200).json({ enabled: true, publicKey, deliveryTime: "08:00", timeZone: "America/Bogota" });
};
