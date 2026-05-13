const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'rendezvous.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS rendezvous (
    id TEXT PRIMARY KEY,
    patientId TEXT NOT NULL,
    medecin TEXT NOT NULL,
    date TEXT NOT NULL,
    heure TEXT NOT NULL,
    motif TEXT NOT NULL,
    statut TEXT DEFAULT 'en_attente'
  )
`);

console.log('Base de données rendezvous connectée ✅');

module.exports = db;