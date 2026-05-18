const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { buildSchema } = require('graphql');
const { createHandler } = require('graphql-http/lib/use/express');
const resolvers = require('./resolvers');

const app = express();
const PORT = 3000;


app.use(express.json());
app.use(cors());


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Trop de requêtes, réessayez après 15 minutes.'
});
app.use(limiter);


const schema = buildSchema(
  fs.readFileSync(path.join(__dirname, 'schema.gql'), 'utf8')
);

app.all('/graphql', createHandler({
  schema,
  rootValue: resolvers
}));


app.get('/patients', async (req, res) => {
  try {
    const result = await resolvers.patients();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/patients/:id', async (req, res) => {
  try {
    const result = await resolvers.patient({ id: req.params.id });
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: 'Patient non trouvé' });
  }
});

app.post('/patients', async (req, res) => {
  try {
    const result = await resolvers.ajouterPatient(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/patients/:id', async (req, res) => {
  try {
    const result = await resolvers.modifierPatient({ id: req.params.id, ...req.body });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/patients/:id', async (req, res) => {
  try {
    const result = await resolvers.supprimerPatient({ id: req.params.id });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


app.get('/rendezvous', async (req, res) => {
  try {
    const result = await resolvers.rendezvous();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/rendezvous/:id', async (req, res) => {
  try {
    const result = await resolvers.unRendezvous({ id: req.params.id });
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: 'Rendez-vous non trouvé' });
  }
});

app.post('/rendezvous', async (req, res) => {
  try {
    const result = await resolvers.ajouterRendezvous(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/rendezvous/:id', async (req, res) => {
  try {
    const result = await resolvers.modifierRendezvous({ id: req.params.id, ...req.body });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/rendezvous/:id', async (req, res) => {
  try {
    const result = await resolvers.supprimerRendezvous({ id: req.params.id });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


app.get('/notifications', async (req, res) => {
  try {
    const result = await resolvers.notifications();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/notifications/:patientId', async (req, res) => {
  try {
    const result = await resolvers.notificationsPatient({ patientId: req.params.patientId });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/', (req, res) => {
  res.json({
    message: 'API Gateway - Clinique Microservices ',
    rest: {
      patients: 'GET/POST /patients',
      patient: 'GET/PUT/DELETE /patients/:id',
      rendezvous: 'GET/POST /rendezvous',
      unRendezvous: 'GET/PUT/DELETE /rendezvous/:id',
      notifications: 'GET /notifications',
      notificationsPatient: 'GET /notifications/:patientId'
    },
    graphql: 'POST /graphql'
  });
});

app.listen(PORT, () => {
  console.log(`API Gateway démarrée sur http://localhost:${PORT} `);
  console.log(`GraphQL disponible sur http://localhost:${PORT}/graphql `);
});