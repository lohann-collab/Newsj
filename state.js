const { getState, saveState, defaultState, sanitizeState, requireAdmin } = require("./store");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  if (req.method === "GET") {
    try { return res.status(200).json(await getState()); }
    catch (e) { return res.status(500).json({ error: "Impossible de lire les résultats." }); }
  }
  if (req.method === "PUT") {
    if (!requireAdmin(req, res)) return;
    try {
      const next = sanitizeState(req.body);
      const saved = await saveState(next);
      return res.status(200).json(saved);
    } catch (e) {
      console.error("state update failed", e);
      return res.status(500).json({ error: "Échec de l’enregistrement. Vérifiez la configuration de la base de données." });
    }
  }
  res.setHeader("Allow", "GET, PUT");
  return res.status(405).json({ error: "Méthode non autorisée." });
};
