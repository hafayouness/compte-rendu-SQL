process.env.DB_FICHIER = ":memory:";

const { test, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../app");
const db = require("../db");

// ---------- Nettoyage ----------
beforeEach(() => {
  db.exec(`
    DELETE FROM notes;
    DELETE FROM inscriptions;
    DELETE FROM cours;
    DELETE FROM etudiants;
    DELETE FROM sqlite_sequence;
  `);
});

after(() => db.close());

// ---------- Helpers ----------
async function creerEtudiant(payload = {}) {
  const res = await request(app)
    .post("/etudiants")
    .send({
      nom: "Alice",
      email: "alice@test.com",
      filiere: "INFO",
      ...payload,
    });
  return res.body;
}

async function creerCours(payload = {}) {
  const res = await request(app)
    .post("/cours")
    .send({
      titre: "Maths",
      enseignant: "M. Salma",
      volume_horaire: 30,
      ...payload,
    });
  return res.body;
}

async function inscrire(etudiantId, coursId) {
  return request(app)
    .post(`/etudiants/${etudiantId}/cours`)
    .send({ cours_id: coursId });
}

async function noter(etudiantId, coursId, valeur) {
  return request(app)
    .post("/notes")
    .send({ etudiant_id: etudiantId, cours_id: coursId, valeur });
}

// =====================================================================
// TESTS DE BASE (tes tests existants, adaptés)
// =====================================================================
test("GET /etudiants renvoie un tableau vide", async () => {
  const res = await request(app).get("/etudiants");
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, []);
});

test("POST /etudiants crée un étudiant", async () => {
  const res = await request(app).post("/etudiants").send({
    nom: "Salma",
    email: "salma@test.com",
    filiere: "Informatique",
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.nom, "Salma");
  assert.ok(res.body.id > 0);
});

test("POST /etudiants sans nom renvoie 400", async () => {
  const res = await request(app)
    .post("/etudiants")
    .send({ email: "test@test.com" });
  assert.equal(res.status, 400);
});

test("POST /etudiants avec email invalide renvoie 400", async () => {
  const res = await request(app)
    .post("/etudiants")
    .send({ nom: "Ahmed", email: "email-invalide" });
  assert.equal(res.status, 400);
});

test("POST /etudiants avec email déjà utilisé renvoie 409", async () => {
  await creerEtudiant({ email: "dup@test.com" });
  const res = await request(app)
    .post("/etudiants")
    .send({ nom: "X", email: "dup@test.com" });
  assert.equal(res.status, 409);
});

test("GET /etudiants/999999 renvoie 404", async () => {
  const res = await request(app).get("/etudiants/999999");
  assert.equal(res.status, 404);
});

test("GET /etudiants/abc renvoie 400", async () => {
  const res = await request(app).get("/etudiants/abc");
  assert.equal(res.status, 400);
});

test("GET adresse inconnue renvoie 404", async () => {
  const res = await request(app).get("/adresse-inconnue");
  assert.equal(res.status, 404);
  assert.equal(res.body.erreur, "Route introuvable");
});

test("GET / renvoie le message de bienvenue", async () => {
  const res = await request(app).get("/");
  assert.equal(res.status, 200);
  assert.match(res.body.message, /Bienvenue/);
});

test("GET /etudiants/recherche borne page à 1", async () => {
  const res = await request(app).get("/etudiants/recherche?page=-5&limite=10");
  assert.equal(res.status, 200);
  assert.equal(res.body.page, 1);
});

test("DELETE /etudiants/:id refuse si inscriptions (409)", async () => {
  const e = await creerEtudiant();
  const c = await creerCours();
  await inscrire(e.id, c.id);

  const res = await request(app).delete(`/etudiants/${e.id}`);
  assert.equal(res.status, 409);
});

// =====================================================================
// COURS
// =====================================================================
test("POST /cours crée un cours", async () => {
  const res = await request(app)
    .post("/cours")
    .send({ titre: "Physique", enseignant: "M. X", volume_horaire: 20 });
  assert.equal(res.status, 201);
  assert.equal(res.body.titre, "Physique");
});

test("POST /cours sans titre renvoie 400", async () => {
  const res = await request(app).post("/cours").send({});
  assert.equal(res.status, 400);
});

test("GET /cours/:id/etudiants liste les inscrits", async () => {
  const e1 = await creerEtudiant({ email: "a@test.com" });
  const e2 = await creerEtudiant({ email: "b@test.com" });
  const c = await creerCours();
  await inscrire(e1.id, c.id);
  await inscrire(e2.id, c.id);

  const res = await request(app).get(`/cours/${c.id}/etudiants`);
  assert.equal(res.status, 200);
  assert.equal(res.body.length, 2);
});

test("GET /cours/9999/etudiants renvoie 404", async () => {
  const res = await request(app).get("/cours/9999/etudiants");
  assert.equal(res.status, 404);
});

test("DELETE /cours/:id refuse si inscriptions (409)", async () => {
  const e = await creerEtudiant();
  const c = await creerCours();
  await inscrire(e.id, c.id);

  const res = await request(app).delete(`/cours/${c.id}`);
  assert.equal(res.status, 409);
});

// =====================================================================
// INSCRIPTIONS
// =====================================================================
test("POST /etudiants/:id/cours inscrit", async () => {
  const e = await creerEtudiant();
  const c = await creerCours();
  const res = await inscrire(e.id, c.id);
  assert.equal(res.status, 201);
  assert.equal(res.body.etudiant_id, e.id);
  assert.equal(res.body.cours_id, c.id);
});

test("POST /etudiants/:id/cours doublon renvoie 409", async () => {
  const e = await creerEtudiant();
  const c = await creerCours();
  await inscrire(e.id, c.id);
  const res = await inscrire(e.id, c.id);
  assert.equal(res.status, 409);
});

test("DELETE /etudiants/:id/cours/:coursId sans inscription renvoie 404", async () => {
  const e = await creerEtudiant();
  const c = await creerCours();
  const res = await request(app).delete(`/etudiants/${e.id}/cours/${c.id}`);
  assert.equal(res.status, 404);
});

// =====================================================================
// NOTES
// =====================================================================
test("POST /notes crée une note valide (après inscription)", async () => {
  const e = await creerEtudiant();
  const c = await creerCours();
  await inscrire(e.id, c.id);

  const res = await noter(e.id, c.id, 15);
  assert.equal(res.status, 201);
  assert.equal(res.body.valeur, 15);
});

test("POST /notes accepte valeur = 0", async () => {
  const e = await creerEtudiant();
  const c = await creerCours();
  await inscrire(e.id, c.id);

  const res = await noter(e.id, c.id, 0);
  assert.equal(res.status, 201);
  assert.equal(res.body.valeur, 0);
});

test("POST /notes valeur > 20 renvoie 400", async () => {
  const e = await creerEtudiant();
  const c = await creerCours();
  await inscrire(e.id, c.id);

  const res = await noter(e.id, c.id, 25);
  assert.equal(res.status, 400);
});

test("POST /notes étudiant inconnu renvoie 404", async () => {
  const c = await creerCours();
  const res = await noter(9999, c.id, 10);
  assert.equal(res.status, 404);
});

test("POST /notes sans inscription renvoie 400 (FK composite)", async () => {
  const e = await creerEtudiant();
  const c = await creerCours();
  const res = await noter(e.id, c.id, 10);
  assert.equal(res.status, 400);
});

test("POST /notes doublon renvoie 409", async () => {
  const e = await creerEtudiant();
  const c = await creerCours();
  await inscrire(e.id, c.id);
  await noter(e.id, c.id, 10);
  const res = await noter(e.id, c.id, 12);
  assert.equal(res.status, 409);
});

test("PUT /notes/:id modifie la valeur", async () => {
  const e = await creerEtudiant();
  const c = await creerCours();
  await inscrire(e.id, c.id);
  const n = (await noter(e.id, c.id, 10)).body;

  const res = await request(app).put(`/notes/${n.id}`).send({ valeur: 18 });
  assert.equal(res.status, 200);
  assert.equal(res.body.valeur, 18);
});

test("DELETE /notes/:id supprime", async () => {
  const e = await creerEtudiant();
  const c = await creerCours();
  await inscrire(e.id, c.id);
  const n = (await noter(e.id, c.id, 10)).body;

  const del = await request(app).delete(`/notes/${n.id}`);
  assert.equal(del.status, 204);

  const get = await request(app).get(`/etudiants/${e.id}/notes`);
  assert.equal(get.body.length, 0);
});

test("GET /etudiants/:id/notes retourne les notes", async () => {
  const e = await creerEtudiant();
  const c = await creerCours();
  await inscrire(e.id, c.id);
  await noter(e.id, c.id, 14);

  const res = await request(app).get(`/etudiants/${e.id}/notes`);
  assert.equal(res.status, 200);
  assert.equal(res.body.length, 1);
  assert.equal(res.body[0].valeur, 14);
});

test("GET /cours/:id/notes retourne les notes du cours", async () => {
  const e = await creerEtudiant();
  const c = await creerCours();
  await inscrire(e.id, c.id);
  await noter(e.id, c.id, 9);

  const res = await request(app).get(`/cours/${c.id}/notes`);
  assert.equal(res.status, 200);
  assert.equal(res.body[0].valeur, 9);
});

test("GET /cours/:id/statistiques calcule nombre/moyenne/min/max", async () => {
  const c = await creerCours();
  const e1 = await creerEtudiant({ email: "s1@test.com" });
  const e2 = await creerEtudiant({ email: "s2@test.com" });
  const e3 = await creerEtudiant({ email: "s3@test.com" });
  await inscrire(e1.id, c.id);
  await inscrire(e2.id, c.id);
  await inscrire(e3.id, c.id);
  await noter(e1.id, c.id, 8);
  await noter(e2.id, c.id, 12);
  await noter(e3.id, c.id, 16);

  const res = await request(app).get(`/cours/${c.id}/statistiques`);
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, {
    cours_id: c.id,
    nombre: 3,
    moyenne: 12,
    minimum: 8,
    maximum: 16,
  });
});

test("GET /etudiants/:id/moyenne calcule la moyenne", async () => {
  const e = await creerEtudiant();
  const c1 = await creerCours({ titre: "A" });
  const c2 = await creerCours({ titre: "B" });
  await inscrire(e.id, c1.id);
  await inscrire(e.id, c2.id);
  await noter(e.id, c1.id, 10);
  await noter(e.id, c2.id, 14);

  const res = await request(app).get(`/etudiants/${e.id}/moyenne`);
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { etudiant_id: e.id, nombre: 2, moyenne: 12 });
});
