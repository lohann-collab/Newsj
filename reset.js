const { defaultState, saveState, requireAdmin } = require("./store");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }
  if (!requireAdmin(req, res)) return;
  try { return res.status(200).json(await saveState(defaultState())); }
  catch (e) { return res.status(500).json({ error: "Impossible de réinitialiser les résultats." }); }
};
