const db = require("../db");

function tous() {
  return db.prepare("SELECT * FROM notes ORDER BY id").all();
}

function parId(id) {
  return db.prepare("SELECT * FROM notes WHERE id = ?").get(id);
}

function creer(data) {
  const result = db
    .prepare(
      `
 INSERT INTO notes (etudiant_id, cours_id, valeur)
 VALUES (?, ?, ?)
 `,
    )
    .run(data.etudiant_id, data.cours_id, data.valeur ?? null); // ✅ ?? et pas ||
  return parId(result.lastInsertRowid);
}

function modifier(id, data) {
  return db
    .prepare(
      `
 UPDATE notes SET valeur = ?
 WHERE id = ?
 `,
    )
    .run(data.valeur ?? null, id).changes; // ✅ ?? et pas ||
}

function supprimer(id) {
  return db.prepare("DELETE FROM notes WHERE id = ?").run(id).changes;
}

function parEtudiant(etudiantId) {
  return db
    .prepare(
      `
 SELECT n.id, n.valeur, n.cours_id, c.titre AS cours_titre, c.enseignant
 FROM notes n
 JOIN cours c ON c.id = n.cours_id
 WHERE n.etudiant_id = ?
 ORDER BY c.titre
 `,
    )
    .all(etudiantId);
}

function parCours(coursId) {
  return db
    .prepare(
      `
 SELECT n.id, n.valeur, n.etudiant_id, e.nom AS etudiant_nom, e.email
 FROM notes n
 JOIN etudiants e ON e.id = n.etudiant_id
 WHERE n.cours_id = ?
 ORDER BY e.nom
 `,
    )
    .all(coursId);
}

function statistiquesCours(coursId) {
  return db
    .prepare(
      `
 SELECT
   COUNT(*)    AS nombre,
   AVG(valeur) AS moyenne,
   MIN(valeur) AS minimum,
   MAX(valeur) AS maximum
 FROM notes
 WHERE cours_id = ?
 `,
    )
    .get(coursId);
}

function moyenneEtudiant(etudiantId) {
  return db
    .prepare(
      `
 SELECT
   COUNT(*)    AS nombre,
   AVG(valeur) AS moyenne
 FROM notes
 WHERE etudiant_id = ?
 `,
    )
    .get(etudiantId);
}

module.exports = {
  tous,
  parId,
  creer,
  modifier,
  supprimer,
  parEtudiant,
  parCours,
  statistiquesCours,
  moyenneEtudiant,
};
