cat > README.md << 'EOF'

# 📚 API de Gestion Scolaire — Express + SQLite

API REST complète pour la gestion d'étudiants, de cours, d'inscriptions
et de notes, développée en Node.js avec Express et SQLite (better-sqlite3).

## ✨ Fonctionnalités

- CRUD complet sur les étudiants et les cours
- Inscription / désinscription d'étudiants à des cours
- Ajout, modification et suppression de notes (0–20)
- Consultation des notes par étudiant et par cours
- Statistiques par cours (nombre, moyenne, minimum, maximum)
- Moyenne générale par étudiant
- Recherche paginée avec tri whitelisté

## 🏗️ Architecture
