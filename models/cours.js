const db = require("../db");

function tous() {
  return db.prepare("SELECT * FROM cours ORDER BY id").all();
}

function parId(id) {
  return db.prepare("SELECT * FROM cours WHERE id = ?").get(id);
}

function creer(data) {
  const result = db
    .prepare(
      `
 INSERT INTO cours (titre, enseignant, volume_horaire)
 VALUES (?, ?, ?)
 `,
    )
    .run(data.titre, data.enseignant ?? null, data.volume_horaire ?? null);
  return parId(result.lastInsertRowid);
}

function modifier(id, data) {
  return db
    .prepare(
      `
 UPDATE cours SET titre = ?, enseignant = ?, volume_horaire = ?
 WHERE id = ?
 `,
    )
    .run(data.titre, data.enseignant ?? null, data.volume_horaire ?? null, id)
    .changes;
}

function supprimer(id) {
  return db.prepare("DELETE FROM cours WHERE id = ?").run(id).changes;
}

module.exports = { tous, parId, creer, modifier, supprimer };
