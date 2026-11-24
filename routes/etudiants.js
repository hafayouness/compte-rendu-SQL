const express = require("express");
const router = express.Router();
const c = require("../controllers/etudiantsControllers");
const notes = require("../controllers/notesControllers");
const db = require("../db");
router.get("/recherche", c.rechercher);
router.get("/", c.tous);
router.get("/:id", c.parId);
router.post("/", c.creer);
router.put("/:id", c.modifier);
router.delete("/:id", c.supprimer);
router.get("/:id/notes", notes.parEtudiant);
router.get("/:id/moyenne", notes.moyenne);
// Inscrire un étudiant à un cours
router.post("/:id/cours", (req, res) => {
  const id = Number(req.params.id);
  const coursId = Number(req.body.cours_id);

  if (
    !Number.isInteger(id) ||
    id <= 0 ||
    !Number.isInteger(coursId) ||
    coursId <= 0
  ) {
    return res.status(400).json({ erreur: "Identifiants invalides" });
  }

  try {
    const etudiant = db
      .prepare("SELECT id FROM etudiants WHERE id = ?")
      .get(id);
    const cours = db.prepare("SELECT id FROM cours WHERE id = ?").get(coursId);

    if (!etudiant || !cours) {
      return res.status(404).json({ erreur: "Étudiant ou cours introuvable" });
    }

    const result = db
      .prepare(`INSERT INTO inscriptions (etudiant_id, cours_id) VALUES (?, ?)`)
      .run(id, coursId);

    res.status(201).json({
      id: result.lastInsertRowid,
      etudiant_id: id,
      cours_id: coursId,
    });
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res
        .status(409)
        .json({ erreur: "Étudiant déjà inscrit à ce cours" });
    }
    if (err.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
      return res.status(400).json({ erreur: "Étudiant ou cours invalide" });
    }
    console.error("❌ ERREUR INSCRIPTION:", err);
    return res.status(500).json({ erreur: "Erreur interne du serveur" });
  }
});

router.get("/:id/cours", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ erreur: "Identifiant invalide" });
  }
  const existe = db.prepare("SELECT id FROM etudiants WHERE id = ?").get(id);
  if (!existe) {
    return res.status(404).json({ erreur: "Étudiant introuvable" });
  }
  const cours = db
    .prepare(
      `
 SELECT c.id, c.titre, c.enseignant
 FROM cours c
 JOIN inscriptions i ON i.cours_id = c.id
 WHERE i.etudiant_id = ?
 `,
    )
    .all(id);
  res.json(cours);
});
// Désinscrire un étudiant d'un cours
router.delete("/:id/cours/:coursId", (req, res) => {
  const id = Number(req.params.id);
  const coursId = Number(req.params.coursId);
  if (
    !Number.isInteger(id) ||
    id <= 0 ||
    !Number.isInteger(coursId) ||
    coursId <= 0
  ) {
    return res.status(400).json({ erreur: "Identifiants invalides" });
  }
  const result = db
    .prepare(
      `
 DELETE FROM inscriptions
 WHERE etudiant_id = ? AND cours_id = ?
 `,
    )
    .run(id, coursId);
  if (result.changes === 0) {
    return res.status(404).json({ erreur: "Inscription introuvable" });
  }
  res.status(204).end();
});
module.exports = router;
