const model = require("../models/cours");

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
  const cours = model.parId(id);
  if (!cours) return res.status(404).json({ erreur: "Cours introuvable" });
  res.json(cours);
}

function creer(req, res) {
  const { titre, enseignant, volume_horaire } = req.body;
  if (!titre || typeof titre !== "string" || !titre.trim()) {
    return res.status(400).json({ erreur: "Titre obligatoire" });
  }
  try {
    const cours = model.creer({
      titre: titre.trim(),
      enseignant,
      volume_horaire,
    });
    res.status(201).json(cours);
  } catch (err) {
    return res.status(500).json({ erreur: "Erreur interne du serveur" });
  }
}

function modifier(req, res) {
  const id = validerId(req, res);
  if (!id) return;
  const { titre, enseignant, volume_horaire } = req.body;
  if (!titre || typeof titre !== "string" || !titre.trim()) {
    return res.status(400).json({ erreur: "Titre obligatoire" });
  }
  try {
    if (!model.parId(id)) {
      return res.status(404).json({ erreur: "Cours introuvable" });
    }
    model.modifier(id, { titre: titre.trim(), enseignant, volume_horaire });
    res.json(model.parId(id));
  } catch (err) {
    return res.status(500).json({ erreur: "Erreur interne du serveur" });
  }
}

function supprimer(req, res) {
  const id = validerId(req, res);
  if (!id) return;
  try {
    if (!model.parId(id)) {
      return res.status(404).json({ erreur: "Cours introuvable" });
    }
    model.supprimer(id);
    res.status(204).end();
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
      return res.status(409).json({
        erreur: "Impossible de supprimer ce cours : des inscriptions existent",
      });
    }
    return res.status(500).json({ erreur: "Erreur interne du serveur" });
  }
}

module.exports = { tous, parId, creer, modifier, supprimer };
