const model = require("../models/Etudiant");
const db = require("../db");

function validerId(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ erreur: "Identifiant invalide" });
    return null;
  }
  return id;
}

function tous(req, res) {
  res.json(model.tous());
}

function parId(req, res) {
  const id = validerId(req, res);
  if (!id) return;
  const etudiant = model.parId(id);
  if (!etudiant)
    return res.status(404).json({ erreur: "Étudiant introuvable" });
  res.json(etudiant);
}

function creer(req, res) {
  const { nom, email, filiere } = req.body;
  if (
    typeof nom !== "string" ||
    !nom.trim() ||
    typeof email !== "string" ||
    !email.trim()
  ) {
    return res.status(400).json({ erreur: "Nom et email obligatoires" });
  }
  if (!email.includes("@")) {
    return res.status(400).json({ erreur: "Email invalide" });
  }

  try {
    const etudiant = model.creer({
      nom: nom.trim(),
      email: email.trim(),
      filiere,
    });
    res.status(201).json(etudiant);
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ erreur: "Email déjà utilisé" });
    }
    // ✅ return obligatoire sinon double envoi / pas de réponse
    return res.status(500).json({ erreur: "Erreur interne du serveur" });
  }
}

function modifier(req, res) {
  const id = validerId(req, res);
  if (!id) return;

  const { nom, email, filiere } = req.body;
  if (
    typeof nom !== "string" ||
    !nom.trim() ||
    typeof email !== "string" ||
    !email.trim()
  ) {
    return res.status(400).json({ erreur: "Nom et email obligatoires" });
  }
  if (!email.includes("@")) {
    return res.status(400).json({ erreur: "Email invalide" });
  }

  try {
    if (!model.parId(id)) {
      return res.status(404).json({ erreur: "Étudiant introuvable" });
    }
    model.modifier(id, { nom: nom.trim(), email: email.trim(), filiere });
    res.json(model.parId(id));
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ erreur: "Email déjà utilisé" });
    }
    return res.status(500).json({ erreur: "Erreur interne du serveur" });
  }
}

function supprimer(req, res) {
  const id = validerId(req, res);
  if (!id) return;

  try {
    if (!model.parId(id)) {
      return res.status(404).json({ erreur: "Étudiant introuvable" });
    }
    const inscription = db
      .prepare(`SELECT id FROM inscriptions WHERE etudiant_id = ?`)
      .get(id);
    if (inscription) {
      return res
        .status(409)
        .json({ erreur: "Cet étudiant possède des inscriptions" });
    }
    model.supprimer(id);
    res.status(204).end();
  } catch (err) {
    return res.status(500).json({ erreur: "Erreur interne du serveur" });
  }
}

function rechercher(req, res) {
  const colonnes = ["id", "nom", "email", "filiere"];
  if (req.query.tri && !colonnes.includes(req.query.tri)) {
    return res.status(400).json({ erreur: "Colonne de tri invalide" });
  }
  if (
    req.query.ordre &&
    !["asc", "desc"].includes(req.query.ordre.toLowerCase())
  ) {
    return res.status(400).json({ erreur: "Ordre de tri invalide" });
  }
  res.json(model.rechercher(req.query));
}
module.exports = { tous, parId, creer, modifier, supprimer, rechercher };
