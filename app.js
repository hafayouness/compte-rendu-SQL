const express = require("express");
const app = express();

app.use(express.json());

// --- Journalisation des requêtes ---
app.use((req, res, next) => {
  const debut = Date.now();
  res.on("finish", () => {
    const duree = Date.now() - debut;
    console.log(
      `${new Date().toISOString()} ${req.method} ${req.originalUrl} ${duree} ms`,
    );
  });
  next();
});

// --- Route d'accueil (AVANT le 404, sinon jamais atteinte) ---
app.get("/", (req, res) => {
  res.status(200).json({ message: "Bienvenue sur mon serveur Express !" });
});

// --- Routes métier ---
app.use("/etudiants", require("./routes/etudiants"));
app.use("/cours", require("./routes/cours"));
app.use("/notes", require("./routes/notes"));

// --- Route inconnue (toujours après les routes métier) ---
app.use((req, res) => {
  res.status(404).json({ erreur: "Route introuvable" });
});

// --- Gestionnaire global d'erreurs ---
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ erreur: "Erreur interne du serveur" });
});

module.exports = app;
