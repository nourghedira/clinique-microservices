const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'patients.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    dateNaissance TEXT NOT NULL,
    telephone TEXT NOT NULL,
    email TEXT NOT NULL
  )
`);

console.log('Base de données patients connectée ');

module.exports = db;