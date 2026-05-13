# Clinique Microservices

Application de gestion de clinique basée sur une architecture microservices.

## Architecture

- **API Gateway** (port 3000) : REST + GraphQL
- **MS Patients** (port 50051) : gRPC + SQLite3
- **MS Rendez-vous** (port 50052) : gRPC + SQLite3 + Kafka Producer
- **MS Notifications** (port 50053) : gRPC + RxDB + Kafka Consumer

## Technologies utilisées

- Node.js
- gRPC + Protobuf
- REST + GraphQL
- Apache Kafka
- SQLite3
- RxDB
- Docker

## Prérequis

- Node.js
- Docker Desktop

## Installation

### 1. Cloner le projet

git clone https://github.com/nourghedira/clinique-microservices.git
cd clinique-microservices

### 2. Installer les dépendances

cd ms-patients && npm install
cd ../ms-rendezvous && npm install
cd ../ms-notifications && npm install
cd ../api-gateway && npm install

### 3. Lancer Kafka

docker-compose up -d

### 4. Lancer les microservices

Terminal 1 : cd ms-patients && node server.js
Terminal 2 : cd ms-rendezvous && node server.js
Terminal 3 : cd ms-notifications && node server.js
Terminal 4 : cd api-gateway && node server.js

## Endpoints REST

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

## GraphQL

Endpoint : POST http://localhost:3000/graphql

### Queries

{ patients { id nom prenom email } }
{ rendezvous { id patientId medecin date statut } }
{ notifications { id patientId message type } }

### Mutations

mutation {
  ajouterPatient(nom: "Ghedira", prenom: "Nour",
  dateNaissance: "2002-04-05", telephone: "22334455",
  email: "test@email.com") { id nom }
}

mutation {
  ajouterRendezvous(patientId: "id", medecin: "Dr. hamdi",
  date: "2026-06-01", heure: "10:00",
  motif: "Consultation") { id statut }
}

## Kafka Topics

| Topic | Producteur | Consommateur |

| rdv-cree | MS Rendez-vous | MS Notifications |

## Auteur

Nour Ghedira - GL2 2025/2026