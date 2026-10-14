const { Redis } = require("@upstash/redis");

function defaultState() {
  return {
    showName: "Francia Politique",
    status: "Résultats de la simulation",
    announcement: "Bienvenue sur Francia Politique. La soirée électorale va bientôt commencer.",
    candidates: [
      { name: "Nicolas Monclaire", percent: 28, color: "#ffbf69" },
      { name: "Camille Durand", percent: 24, color: "#ff805d" },
      { name: "Alexandre Morel", percent: 19, color: "#6e9eff" },
      { name: "Sarah Bernard", percent: 16, color: "#60d5a5" },
      { name: "Julien Lefèvre", percent: 13, color: "#be94ff" }
    ],
    updatedAt: new Date().toISOString()
  };
}
function kv() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error("Upstash Redis is not configured");
  }
  return new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
}
async function getState() {
  const client = kv();
  const state = await client.get("francia-politique:state");
  if (!state) {
    const initial = defaultState();
    await client.set("francia-politique:state", initial);
    return initial;
  }
  return typeof state === "string" ? JSON.parse(state) : state;
}
function sanitizeState(input) {
  if (!input || typeof input !== "object") throw new Error("Invalid state");
  const candidates = Array.isArray(input.candidates) ? input.candidates.slice(0, 8).map(c => ({
    name: String(c?.name || "Candidat sans nom").trim().slice(0, 70) || "Candidat sans nom",
    percent: Math.max(0, Math.min(100, Number.isFinite(Number(c?.percent)) ? Number(c.percent) : 0)),
    color: /^#[0-9a-f]{6}$/i.test(String(c?.color || "")) ? String(c.color) : "#ffbf69"
  })) : [];
  if (candidates.length < 1) throw new Error("At least one candidate required");
  return {
    showName: String(input.showName || "Francia Politique").trim().slice(0, 60) || "Francia Politique",
    status: String(input.status || "Résultats de la simulation").trim().slice(0, 100),
    announcement: String(input.announcement || "").trim().slice(0, 500),
    candidates,
    updatedAt: new Date().toISOString()
  };
}
function safeEqual(a, b) {
  const crypto = require("crypto");
  const x = Buffer.from(String(a || ""));
  const y = Buffer.from(String(b || ""));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
function requireAdmin(req, res) {
  const secret = process.env.ADMIN_TOKEN_SECRET;
  const expected = secret ? require("crypto").createHmac("sha256", secret).update("francia-politique-admin-v1").digest("hex") : "";
  const supplied = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!secret || secret.length < 32 || !expected || !safeEqual(supplied, expected)) {
    res.status(401).json({ error: "Connexion administrateur requise." });
    return false;
  }
  return true;
}
async function saveState(state) {
  const client = kv();
  const clean = { ...state, updatedAt: new Date().toISOString() };
  await client.set("francia-politique:state", clean);
  return clean;
}
module.exports = { getState, saveState, defaultState, sanitizeState, requireAdmin };
