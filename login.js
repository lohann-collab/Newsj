const crypto = require("crypto");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || expected.length < 12) {
    return res.status(503).json({ error: "Configurez ADMIN_PASSWORD (12 caractères minimum) dans Vercel." });
  }
  const supplied = String(req.body?.password || "");
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  const valid = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!valid) return res.status(401).json({ error: "Mot de passe incorrect." });
  const secret = process.env.ADMIN_TOKEN_SECRET;
  if (!secret || secret.length < 32) {
    return res.status(503).json({ error: "Configurez ADMIN_TOKEN_SECRET (32 caractères minimum) dans Vercel." });
  }
  const token = crypto.createHmac("sha256", secret).update("francia-politique-admin-v1").digest("hex");
  return res.status(200).json({ token });
};
