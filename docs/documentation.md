# Documentation Technique

## 1. Description du projet

Application de gestion de clinique basée sur une architecture microservices.
Développée en Node.js avec gRPC, REST, GraphQL et Kafka.

## 2. Microservices

### MS Patients (port 50051)
- Responsabilité : Gérer les patients de la clinique
- Protocole : gRPC
- Base de données : SQLite3
- Fichier proto : ms-patients/patient.proto
- Fonctions exposées :
  - GetAllPatients
  - GetPatient
  - CreatePatient
  - UpdatePatient
  - DeletePatient

### MS Rendez-vous (port 50052)
- Responsabilité : Gérer les rendez-vous
- Protocole : gRPC
- Base de données : SQLite3
- Fichier proto : ms-rendezvous/rendezvous.proto
- Kafka : Producteur du topic rdv-cree
- Fonctions exposées :
  - GetAllRendezvous
  - GetRendezvous
  - CreateRendezvous
  - UpdateRendezvous
  - DeleteRendezvous

### MS Notifications (port 50053)
- Responsabilité : Gérer les notifications automatiques
- Protocole : gRPC
- Base de données : RxDB (NoSQL)
- Fichier proto : ms-notifications/notification.proto
- Kafka : Consommateur du topic rdv-cree
- Fonctions exposées :
  - GetAllNotifications
  - GetNotificationsByPatient

## 3. Bases de données

### SQLite3 (SQL)
- Utilisé par : MS Patients et MS Rendez-vous
- Pourquoi : Données structurées avec relations claires
- Tables :
  - patients (id, nom, prenom, dateNaissance, telephone, email)
  - rendezvous (id, patientId, medecin, date, heure, motif, statut)

### RxDB (NoSQL)
- Utilisé par : MS Notifications
- Pourquoi : Données non structurées, stockage de documents JSON
- Collections :
  - notifications (id, patientId, message, date, type)

## 4. Kafka

### Topic : rdv-cree
- Producteur : MS Rendez-vous
- Consommateur : MS Notifications
- Déclencheur : Création d'un nouveau rendez-vous
- Contenu du message :
  - id du rendez-vous
  - patientId
  - medecin
  - date et heure
  - motif
  - statut

### Scénario métier
Quand un rendez-vous est créé :
1. MS Rendez-vous enregistre le RDV dans SQLite3
2. MS Rendez-vous publie un événement dans Kafka
3. MS Notifications reçoit l'événement
4. MS Notifications crée automatiquement une notification dans RxDB

## 5. API Gateway

### REST Endpoints

| Méthode | Endpoint | Description |

| GET | /patients | Liste tous les patients |
| POST | /patients | Ajouter un patient |
| GET | /patients/:id | Récupérer un patient |
| PUT | /patients/:id | Modifier un patient |
| DELETE | /patients/:id | Supprimer un patient |
| GET | /rendezvous | Liste tous les rendez-vous |
| POST | /rendezvous | Créer un rendez-vous |
| GET | /rendezvous/:id | Récupérer un rendez-vous |
| PUT | /rendezvous/:id | Modifier un rendez-vous |
| DELETE | /rendezvous/:id | Supprimer un rendez-vous |
| GET | /notifications | Liste toutes les notifications |
| GET | /notifications/:patientId | Notifications d'un patient |

### GraphQL Schema

Types principaux :
- Patient (id, nom, prenom, dateNaissance, telephone, email)
- Rendezvous (id, patientId, medecin, date, heure, motif, statut)
- Notification (id, patientId, message, date, type)

Queries disponibles :
- patients
- patient(id)
- rendezvous
- unRendezvous(id)
- notifications
- notificationsPatient(patientId)

Mutations disponibles :
- ajouterPatient
- modifierPatient
- supprimerPatient
- ajouterRendezvous
- modifierRendezvous
- supprimerRendezvous

## Pourquoi GraphQL ?
GraphQL permet au client de demander exactement 
les champs nécessaires sans surcharge de données,
contrairement à REST qui retourne toujours 
tous les champs.

## 6. Sécurité

- CORS activé sur l'API Gateway
- Rate Limiting : 100 requêtes / 15 minutes par IP

## 7. Docker

### Conteneurisation
Chaque microservice possède son propre Dockerfile :

| Service | Dockerfile |
|---|---|
| MS Patients | ms-patients/Dockerfile |
| MS Rendez-vous | ms-rendezvous/Dockerfile |
| MS Notifications | ms-notifications/Dockerfile |
| API Gateway | api-gateway/Dockerfile |

### Volumes
Les données sont persistées grâce aux volumes Docker :

| Volume | Fichier |
|---|---|
| patients.db | ms-patients/patients.db |
| rendezvous.db | ms-rendezvous/rendezvous.db |
| notifications.json | ms-notifications/notifications.json |

### Commandes importantes

| Commande | Description |
|---|---|
| `docker-compose up --build` | Lance tout le projet |
| `docker-compose stop` | Arrête proprement sans perdre les données |
| `docker-compose start` | Relance après arrêt |
| `docker ps` | Vérifie les containers actifs |
| `docker logs ms-patients` | Voir les logs d'un container |