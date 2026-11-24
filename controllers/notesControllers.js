const model = require("../models/notes");
const db = require("../db");

function validerId(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ erreur: "Identifiant invalide" });
    return null;
  }
  return id;
}

function validerValeur(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > 20) return null;
  return n;
}

function creer(req, res) {
  const etudiantId = Number(req.body.etudiant_id);
  const coursId = Number(req.body.cours_id);
  const valeur = validerValeur(req.body.valeur);

  if (
    !Number.isInteger(etudiantId) ||
    etudiantId <= 0 ||
    !Number.isInteger(coursId) ||
    coursId <= 0
  ) {
    return res.status(400).json({ erreur: "etudiant_id et cours_id requis" });
  }
  if (valeur === null) {
    return res.status(400).json({ erreur: "La note doit être entre 0 et 20" });
  }

  try {
    const etu = db
      .prepare("SELECT id FROM etudiants WHERE id = ?")
      .get(etudiantId);
    const crs = db.prepare("SELECT id FROM cours WHERE id = ?").get(coursId);
    if (!etu || !crs) {
      return res.status(404).json({ erreur: "Étudiant ou cours introuvable" });
    }

    const note = model.creer({
      etudiant_id: etudiantId,
      cours_id: coursId,
      valeur,
    });
    res.status(201).json(note);
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res
        .status(409)
        .json({ erreur: "Note déjà existante pour ce cours" });
    }
    if (err.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
      return res
        .status(400)
        .json({ erreur: "L'étudiant n'est pas inscrit à ce cours" });
    }
    if (err.code === "SQLITE_CONSTRAINT_CHECK") {
      return res.status(400).json({ erreur: "Valeur hors limites" });
    }
    return res.status(500).json({ erreur: "Erreur interne du serveur" });
  }
}

function modifier(req, res) {
  const id = validerId(req, res);
  if (!id) return;

  const valeur = validerValeur(req.body.valeur);
  if (valeur === null) {
    return res.status(400).json({ erreur: "La note doit être entre 0 et 20" });
  }

  try {
    if (!model.parId(id)) {
      return res.status(404).json({ erreur: "Note introuvable" });
    }
    model.modifier(id, { valeur });
    res.json(model.parId(id));
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT_CHECK") {
      return res.status(400).json({ erreur: "Valeur hors limites" });
    }
    return res.status(500).json({ erreur: "Erreur interne du serveur" });
  }
}

function supprimer(req, res) {
  const id = validerId(req, res);
  if (!id) return;

  try {
    const changes = model.supprimer(id);
    if (changes === 0) {
      return res.status(404).json({ erreur: "Note introuvable" });
    }
    res.status(204).end();
  } catch (err) {
    return res.status(500).json({ erreur: "Erreur interne du serveur" });
  }
}

function parEtudiant(req, res) {
  const id = validerId(req, res);
  if (!id) return;
  const existe = db.prepare("SELECT id FROM etudiants WHERE id = ?").get(id);
  if (!existe) return res.status(404).json({ erreur: "Étudiant introuvable" });
  res.json(model.parEtudiant(id));
}

function parCours(req, res) {
  const id = validerId(req, res);
  if (!id) return;
  const existe = db.prepare("SELECT id FROM cours WHERE id = ?").get(id);
  if (!existe) return res.status(404).json({ erreur: "Cours introuvable" });
  res.json(model.parCours(id));
}

function statistiques(req, res) {
  const id = validerId(req, res);
  if (!id) return;
  const existe = db.prepare("SELECT id FROM cours WHERE id = ?").get(id);
  if (!existe) return res.status(404).json({ erreur: "Cours introuvable" });

  const s = model.statistiquesCours(id);
  res.json({
    cours_id: id,
    nombre: s.nombre,
    moyenne: s.moyenne === null ? null : Number(s.moyenne.toFixed(2)),
    minimum: s.minimum,
    maximum: s.maximum,
  });
}

function moyenne(req, res) {
  const id = validerId(req, res);
  if (!id) return;
  const existe = db.prepare("SELECT id FROM etudiants WHERE id = ?").get(id);
  if (!existe) return res.status(404).json({ erreur: "Étudiant introuvable" });

  const m = model.moyenneEtudiant(id);
  res.json({
    etudiant_id: id,
    nombre: m.nombre,
    moyenne: m.moyenne === null ? null : Number(m.moyenne.toFixed(2)),
  });
}

module.exports = {
  creer,
  modifier,
  supprimer,
  parEtudiant,
  parCours,
  statistiques,
  moyenne,
};
