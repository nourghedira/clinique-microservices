const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const { randomUUID } = require('crypto');
const db = require('./db');

// Charger le fichier proto
const packageDefinition = protoLoader.loadSync(
  path.join(__dirname, 'patient.proto'),
  {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  }
);

const patientProto = grpc.loadPackageDefinition(packageDefinition).patients;

// Implémenter les fonctions gRPC

function getAllPatients(call, callback) {
  const patients = db.prepare('SELECT * FROM patients').all();
  callback(null, { patients });
}

function getPatient(call, callback) {
  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(call.request.id);
  if (!patient) {
    return callback({ code: grpc.status.NOT_FOUND, message: 'Patient non trouvé' });
  }
  callback(null, patient);
}

function createPatient(call, callback) {
  const { nom, prenom, dateNaissance, telephone, email } = call.request;
  const id = randomUUID();
  db.prepare(`
    INSERT INTO patients (id, nom, prenom, dateNaissance, telephone, email)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, nom, prenom, dateNaissance, telephone, email);
  callback(null, { id, nom, prenom, dateNaissance, telephone, email });
}

function updatePatient(call, callback) {
  const { id, nom, prenom, dateNaissance, telephone, email } = call.request;
  const existing = db.prepare('SELECT * FROM patients WHERE id = ?').get(id);
  if (!existing) {
    return callback({ code: grpc.status.NOT_FOUND, message: 'Patient non trouvé' });
  }
  db.prepare(`
    UPDATE patients SET nom=?, prenom=?, dateNaissance=?, telephone=?, email=?
    WHERE id=?
  `).run(nom, prenom, dateNaissance, telephone, email, id);
  callback(null, { id, nom, prenom, dateNaissance, telephone, email });
}

function deletePatient(call, callback) {
  const existing = db.prepare('SELECT * FROM patients WHERE id = ?').get(call.request.id);
  if (!existing) {
    return callback({ code: grpc.status.NOT_FOUND, message: 'Patient non trouvé' });
  }
  db.prepare('DELETE FROM patients WHERE id = ?').run(call.request.id);
  callback(null, { success: true });
}

// Démarrer le serveur gRPC
function main() {
  const server = new grpc.Server();
  server.addService(patientProto.PatientService.service, {
    getAllPatients,
    getPatient,
    createPatient,
    updatePatient,
    deletePatient
  });

  server.bindAsync(
    '0.0.0.0:50051',
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        console.error('Erreur démarrage serveur:', err);
        return;
      }
      console.log(`MS Patients démarré sur le port ${port} ✅`);
    }
  );
}

main();