const Database = require("better-sqlite3");
const path = require("path");
const fichier = process.env.DB_FICHIER || "ecole.db";
const db = new Database(
  fichier === ":memory:" ? ":memory:" : path.resolve(fichier),
);
db.pragma("foreign_keys = ON");
db.exec(`
 CREATE TABLE IF NOT EXISTS etudiants (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 nom TEXT NOT NULL,
 email TEXT NOT NULL UNIQUE,
 filiere TEXT
 );
 CREATE TABLE IF NOT EXISTS cours (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 titre TEXT NOT NULL,
 enseignant TEXT,
 volume_horaire INTEGER
 );
 CREATE TABLE IF NOT EXISTS inscriptions (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 etudiant_id INTEGER NOT NULL,
 cours_id INTEGER NOT NULL,
 date_inscription TEXT DEFAULT CURRENT_TIMESTAMP,
 UNIQUE (etudiant_id, cours_id),
 FOREIGN KEY (etudiant_id) REFERENCES etudiants(id),
 FOREIGN KEY (cours_id) REFERENCES cours(id)
 );
 CREATE TABLE IF NOT EXISTS notes (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 etudiant_id INTEGER NOT NULL,
 cours_id INTEGER NOT NULL,
 valeur REAL NOT NULL CHECK (valeur >= 0 AND valeur <= 20),
 date_saisie TEXT DEFAULT CURRENT_TIMESTAMP,
 UNIQUE (etudiant_id, cours_id),
 FOREIGN KEY (etudiant_id, cours_id)
 REFERENCES inscriptions(etudiant_id, cours_id)
 );
`);
module.exports = db;
