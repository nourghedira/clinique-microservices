## Architecture
REST/GraphQL
 ┌──────────┐ ─────────────────► ┌─────────────────┐
 │  Client  │                    │   API Gateway   │ (port 3000)
 │ app.js   │ ◄───────────────── │   server.js     │
 └──────────┘   JSON response    └─────────────────┘
                                  │        │        │
                                gRPC      gRPC     gRPC
                                  │        │        │
                                  ▼        ▼        ▼
                     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
                     │  MS Patients │ │MS Rendez-vous│ │     MS       │
                     │  server.js   │ │  server.js   │ │Notifications │
                     │  port 50051  │ │  port 50052  │ │  port 50053  │
                     └──────────────┘ └──────────────┘ └──────────────┘
                           │                 │                 │
                        SQLite3           SQLite3            RxDB
                       patients.db      rendezvous.db   notifications.json
                                      Kafka produce      Kafka consume
                                             │                 │
                                             ▼                 │
                                    ┌─────────────────┐       │
                                    │   Kafka Broker  │ ──────┘
                                    │   port 9092     │
                                    │   rdv-cree      │
                                    └─────────────────┘

                                    




## Ports

| Service | Port |
|---|---|
| API Gateway | 3000 |
| MS Patients | 50051 |
| MS Rendez-vous | 50052 |
| MS Notifications | 50053 |
| Kafka Broker | 9092 |
| Zookeeper | 2181 |