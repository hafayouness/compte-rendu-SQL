const express = require("express");
const router = express.Router();
const c = require("../controllers/coursControllers");
const notes = require("../controllers/notesControllers");
const db = require("../db");
router.get("/", c.tous);
router.get("/:id", c.parId);
router.post("/", c.creer);
router.put("/:id", c.modifier);
router.delete("/:id", c.supprimer);
router.get("/:id/notes", notes.parCours);
router.get("/:id/statistiques", notes.statistiques);
// Étudiants inscrits à un cours
router.get("/:id/etudiants", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ erreur: "Identifiant invalide" });
  }
  const cours = db.prepare("SELECT id FROM cours WHERE id = ?").get(id);
  if (!cours) return res.status(404).json({ erreur: "Cours introuvable" });
  const etudiants = db
    .prepare(
      `
 SELECT e.id, e.nom, e.email, e.filiere
 FROM etudiants e
 JOIN inscriptions i ON i.etudiant_id = e.id
 WHERE i.cours_id = ?
 `,
    )
    .all(id);
  res.json(etudiants);
});
module.exports = router;
