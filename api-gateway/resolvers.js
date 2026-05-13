const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Charger les protos
const patientProto = grpc.loadPackageDefinition(
  protoLoader.loadSync(
    path.join(__dirname, '../ms-patients/patient.proto'),
    { keepCase: false, longs: String, enums: String, defaults: true, oneofs: true }
  )
).patients;

const rendezvousProto = grpc.loadPackageDefinition(
  protoLoader.loadSync(
    path.join(__dirname, '../ms-rendezvous/rendezvous.proto'),
    { keepCase: false, longs: String, enums: String, defaults: true, oneofs: true }
  )
).rendezvous;

const notificationProto = grpc.loadPackageDefinition(
  protoLoader.loadSync(
    path.join(__dirname, '../ms-notifications/notification.proto'),
    { keepCase: false, longs: String, enums: String, defaults: true, oneofs: true }
  )
).notifications;

// Créer les clients gRPC
const patientClient = new patientProto.PatientService(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

const rendezvousClient = new rendezvousProto.RendezvousService(
  'localhost:50052',
  grpc.credentials.createInsecure()
);

const notificationClient = new notificationProto.NotificationService(
  'localhost:50053',
  grpc.credentials.createInsecure()
);

// Fonctions utilitaires
function grpcCall(client, method, request) {
  return new Promise((resolve, reject) => {
    client[method](request, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
}

// Resolvers GraphQL
module.exports = {
  // Queries
  patients: () => grpcCall(patientClient, 'getAllPatients', {}).then(r => r.patients),
  patient: ({ id }) => grpcCall(patientClient, 'getPatient', { id }),
  rendezvous: () => grpcCall(rendezvousClient, 'getAllRendezvous', {}).then(r => r.rendezvous),
  unRendezvous: ({ id }) => grpcCall(rendezvousClient, 'getRendezvous', { id }),
  notifications: () => grpcCall(notificationClient, 'getAllNotifications', {}).then(r => r.notifications),
  notificationsPatient: ({ patientId }) => grpcCall(notificationClient, 'getNotificationsByPatient', { patientId }).then(r => r.notifications),

  // Mutations patients
  ajouterPatient: (args) => grpcCall(patientClient, 'createPatient', args),
  modifierPatient: (args) => grpcCall(patientClient, 'updatePatient', args),
  supprimerPatient: ({ id }) => grpcCall(patientClient, 'deletePatient', { id }),

  // Mutations rendez-vous
  ajouterRendezvous: (args) => grpcCall(rendezvousClient, 'createRendezvous', args),
  modifierRendezvous: (args) => grpcCall(rendezvousClient, 'updateRendezvous', args),
  supprimerRendezvous: ({ id }) => grpcCall(rendezvousClient, 'deleteRendezvous', { id })
};