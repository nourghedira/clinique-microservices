const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const { randomUUID } = require('crypto');
const { Kafka } = require('kafkajs');
const db = require('./db');

// Configuration Kafka
const kafka = new Kafka({
  clientId: 'ms-rendezvous',
  brokers: ['localhost:9092']
});
const producer = kafka.producer();

// Charger le fichier proto
const packageDefinition = protoLoader.loadSync(
  path.join(__dirname, 'rendezvous.proto'),
  {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  }
);

const rendezvousProto = grpc.loadPackageDefinition(packageDefinition).rendezvous;

// Fonctions gRPC
function getAllRendezvous(call, callback) {
  const rendezvous = db.prepare('SELECT * FROM rendezvous').all();
  callback(null, { rendezvous });
}

function getRendezvous(call, callback) {
  const rdv = db.prepare('SELECT * FROM rendezvous WHERE id = ?').get(call.request.id);
  if (!rdv) {
    return callback({ code: grpc.status.NOT_FOUND, message: 'Rendez-vous non trouvé' });
  }
  callback(null, rdv);
}

async function createRendezvous(call, callback) {
  const { patientId, medecin, date, heure, motif } = call.request;
  const id = randomUUID();
  const statut = 'en_attente';

  db.prepare(`
    INSERT INTO rendezvous (id, patientId, medecin, date, heure, motif, statut)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, patientId, medecin, date, heure, motif, statut);

  // Publier événement Kafka
  await producer.send({
    topic: 'rdv-cree',
    messages: [{
      value: JSON.stringify({ id, patientId, medecin, date, heure, motif, statut })
    }]
  });

  console.log('Événement Kafka publié : rdv-cree ✅');
  callback(null, { id, patientId, medecin, date, heure, motif, statut });
}

function updateRendezvous(call, callback) {
  const { id, patientId, medecin, date, heure, motif, statut } = call.request;
  const existing = db.prepare('SELECT * FROM rendezvous WHERE id = ?').get(id);
  if (!existing) {
    return callback({ code: grpc.status.NOT_FOUND, message: 'Rendez-vous non trouvé' });
  }
  db.prepare(`
    UPDATE rendezvous SET patientId=?, medecin=?, date=?, heure=?, motif=?, statut=?
    WHERE id=?
  `).run(patientId, medecin, date, heure, motif, statut, id);
  callback(null, { id, patientId, medecin, date, heure, motif, statut });
}

function deleteRendezvous(call, callback) {
  const existing = db.prepare('SELECT * FROM rendezvous WHERE id = ?').get(call.request.id);
  if (!existing) {
    return callback({ code: grpc.status.NOT_FOUND, message: 'Rendez-vous non trouvé' });
  }
  db.prepare('DELETE FROM rendezvous WHERE id = ?').run(call.request.id);
  callback(null, { success: true });
}

// Démarrer le serveur
async function main() {
  await producer.connect();
  console.log('Kafka producer connecté ✅');

  const server = new grpc.Server();
  server.addService(rendezvousProto.RendezvousService.service, {
    getAllRendezvous,
    getRendezvous,
    createRendezvous,
    updateRendezvous,
    deleteRendezvous
  });

  server.bindAsync(
    '0.0.0.0:50052',
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        console.error('Erreur démarrage serveur:', err);
        return;
      }
      console.log(`MS Rendez-vous démarré sur le port ${port} ✅`);
    }
  );
}

main();