const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const { Kafka } = require('kafkajs');
const dbPromise = require('./db');

const kafka = new Kafka({
  clientId: 'ms-notifications',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});
const consumer = kafka.consumer({ groupId: 'notifications-group' });


const packageDefinition = protoLoader.loadSync(
  path.join(__dirname, 'notification.proto'),
  {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  }
);

const notificationProto = grpc.loadPackageDefinition(packageDefinition).notifications;


async function getAllNotifications(call, callback) {
  const { notifications } = await dbPromise;
  const docs = await notifications.find().exec();
  callback(null, { notifications: docs.map(d => d.toJSON()) });
}

async function getNotificationsByPatient(call, callback) {
  const { notifications } = await dbPromise;
  const docs = await notifications.find({
    selector: { patientId: call.request.patientId }
  }).exec();
  callback(null, { notifications: docs.map(d => d.toJSON()) });
}


async function startKafkaConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'rdv-cree', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const rdv = JSON.parse(message.value.toString());
      console.log('Événement Kafka reçu :', rdv);

      const { notifications, persistNotifications, createId } = await dbPromise;

      await notifications.insert({
        id: createId(),
        patientId: rdv.patientId,
        message: `Votre rendez-vous avec Dr. ${rdv.medecin} est confirmé pour le ${rdv.date} à ${rdv.heure}`,
        date: new Date().toISOString(),
        type: 'rdv_cree'
      });

      await persistNotifications(notifications);
      console.log('Notification enregistrée ');
    }
  });
}


async function main() {
  await startKafkaConsumer();
  console.log('Kafka consumer connecté ');

  const server = new grpc.Server();
  server.addService(notificationProto.NotificationService.service, {
    getAllNotifications,
    getNotificationsByPatient
  });

  server.bindAsync(
    '0.0.0.0:50053',
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        console.error('Erreur démarrage serveur:', err);
        return;
      }
      console.log(`MS Notifications démarré sur le port ${port} `);
    }
  );
}

main();