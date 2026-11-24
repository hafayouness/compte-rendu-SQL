const db = require("../db");
const colonnesAutorisees = ["nom", "email", "filiere"];

function tous() {
  return db.prepare("SELECT * FROM etudiants ORDER BY id").all();
}

function parId(id) {
  return db.prepare("SELECT * FROM etudiants WHERE id = ?").get(id);
}

function creer(data) {
  const result = db
    .prepare(
      `
 INSERT INTO etudiants (nom, email, filiere)
 VALUES (?, ?, ?)
 `,
    )
    .run(data.nom, data.email, data.filiere ?? null);
  return parId(result.lastInsertRowid);
}

function modifier(id, data) {
  return db
    .prepare(
      `
 UPDATE etudiants
 SET nom = ?, email = ?, filiere = ?
 WHERE id = ?
 `,
    )
    .run(data.nom, data.email, data.filiere ?? null, id).changes;
}

function supprimer(id) {
  return db.prepare("DELETE FROM etudiants WHERE id = ?").run(id).changes;
}

function rechercher(options) {
  const conditions = [];
  const valeurs = [];

  if (options.filiere) {
    conditions.push("filiere = ?");
    valeurs.push(options.filiere);
  }
  if (options.q) {
    conditions.push("nom LIKE ?");
    valeurs.push(`%${options.q}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const tri = colonnesAutorisees.includes(options.tri) ? options.tri : "id";
  const ordre = options.ordre === "desc" ? "DESC" : "ASC";

  const page = Math.max(1, Number(options.page) || 1); // ✅ bornée
  const limite = Math.min(Math.max(Number(options.limite) || 10, 1), 50);
  const offset = (page - 1) * limite;

  const total = db
    .prepare(`SELECT COUNT(*) AS total FROM etudiants ${where}`)
    .get(...valeurs).total;

  const donnees = db
    .prepare(
      `SELECT * FROM etudiants ${where}
       ORDER BY ${tri} ${ordre}
       LIMIT ? OFFSET ?`,
    )
    .all(...valeurs, limite, offset);

  return { donnees, page, limite, total };
}

module.exports = { tous, parId, creer, modifier, supprimer, rechercher };
