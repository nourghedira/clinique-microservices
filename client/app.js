const API = 'http://localhost:3000';

const pages = {
  patients: { title: 'Gestion des patients', sub: 'Ajouter, modifier et supprimer des patients' },
  rendezvous: { title: 'Gestion des rendez-vous', sub: 'Planifier et gérer les rendez-vous' },
  notifications: { title: 'Notifications', sub: 'Notifications automatiques générées par Kafka' }
};

// ===================== NAVIGATION =====================

function showSection(name, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById('section-' + name).classList.add('active');
  if (btn) btn.classList.add('active');
  document.getElementById('page-title').textContent = pages[name].title;
  document.getElementById('page-sub').textContent = pages[name].sub;
}

function showMsg(id, msg, type) {
  const el = document.getElementById(id);
  const icon = type === 'success' ? 'circle-check' : 'circle-exclamation';
  el.innerHTML = `<div class="alert alert-${type}"><i class="fa-solid fa-${icon}"></i> ${msg}</div>`;
  setTimeout(() => el.innerHTML = '', 3000);
}

function ouvrirModal(id) { document.getElementById(id).classList.add('open'); }
function fermerModal(id) { document.getElementById(id).classList.remove('open'); }

// ===================== PATIENTS =====================

async function ajouterPatient() {
  const data = {
    nom: document.getElementById('p-nom').value,
    prenom: document.getElementById('p-prenom').value,
    dateNaissance: document.getElementById('p-date').value,
    telephone: document.getElementById('p-tel').value,
    email: document.getElementById('p-email').value
  };

  if (!data.nom || !data.prenom || !data.email) {
    showMsg('msg-patient', 'Veuillez remplir tous les champs obligatoires', 'error');
    return;
  }

  try {
    const res = await fetch(`${API}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error();
    showMsg('msg-patient', 'Patient ajouté avec succès !', 'success');
    ['p-nom', 'p-prenom', 'p-date', 'p-tel', 'p-email'].forEach(id => document.getElementById(id).value = '');
    chargerPatients();
  } catch (e) {
    showMsg('msg-patient', "Erreur lors de l'ajout du patient", 'error');
  }
}

async function chargerPatients() {
  try {
    const res = await fetch(`${API}/patients`);
    const patients = await res.json();
    document.getElementById('stat-patients').textContent = patients.length;
    document.getElementById('badge-patients').textContent = patients.length;

    // Recharger le select rendez-vous
    const select = document.getElementById('rdv-patientId');
    select.innerHTML = `<option value="">-- Choisir un patient --</option>` +
      patients.map(p => `<option value="${p.id}">${p.nom} ${p.prenom}</option>`).join('');

    const tbody = document.getElementById('liste-patients');
    if (patients.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5"><div class="empty"><i class="fa-solid fa-user-slash"></i><p>Aucun patient enregistré</p></div></td></tr>`;
      return;
    }

    tbody.innerHTML = patients.map(p => `
      <tr>
        <td><strong>${p.nom} ${p.prenom}</strong></td>
        <td>${p.dateNaissance || '-'}</td>
        <td>${p.telephone}</td>
        <td>${p.email}</td>
        <td>
          <div class="actions">
            <button class="btn btn-warning btn-sm" onclick="modifierPatient('${p.id}','${p.nom}','${p.prenom}','${p.dateNaissance}','${p.telephone}','${p.email}')">
              <i class="fa-solid fa-pen"></i> Modifier
            </button>
            <button class="btn btn-danger btn-sm" onclick="supprimerPatient('${p.id}')">
              <i class="fa-solid fa-trash"></i> Supprimer
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    document.getElementById('liste-patients').innerHTML = `<tr><td colspan="5"><div class="empty"><i class="fa-solid fa-triangle-exclamation"></i><p>Erreur de connexion</p></div></td></tr>`;
  }
}

function modifierPatient(id, nom, prenom, date, tel, email) {
  document.getElementById('edit-p-id').value = id;
  document.getElementById('edit-p-nom').value = nom;
  document.getElementById('edit-p-prenom').value = prenom;
  document.getElementById('edit-p-date').value = date;
  document.getElementById('edit-p-tel').value = tel;
  document.getElementById('edit-p-email').value = email;
  ouvrirModal('modal-patient');
}

async function sauvegarderPatient() {
  const id = document.getElementById('edit-p-id').value;
  const data = {
    nom: document.getElementById('edit-p-nom').value,
    prenom: document.getElementById('edit-p-prenom').value,
    dateNaissance: document.getElementById('edit-p-date').value,
    telephone: document.getElementById('edit-p-tel').value,
    email: document.getElementById('edit-p-email').value
  };
  try {
    await fetch(`${API}/patients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    fermerModal('modal-patient');
    chargerPatients();
  } catch (e) {
    alert('Erreur lors de la modification');
  }
}

async function supprimerPatient(id) {
  if (!confirm('Supprimer ce patient ?')) return;
  await fetch(`${API}/patients/${id}`, { method: 'DELETE' });
  chargerPatients();
}

// ===================== RENDEZ-VOUS =====================

async function ajouterRendezvous() {
  const data = {
    patientId: document.getElementById('rdv-patientId').value,
    medecin: document.getElementById('rdv-medecin').value,
    date: document.getElementById('rdv-date').value,
    heure: document.getElementById('rdv-heure').value,
    motif: document.getElementById('rdv-motif').value
  };

  if (!data.patientId || !data.medecin || !data.date) {
    showMsg('msg-rdv', 'Veuillez remplir tous les champs obligatoires', 'error');
    return;
  }

  try {
    const res = await fetch(`${API}/rendezvous`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error();
    showMsg('msg-rdv', 'Rendez-vous ajouté ! Notification envoyée via Kafka.', 'success');
    chargerRendezvous();
    chargerNotifications();
  } catch (e) {
    showMsg('msg-rdv', "Erreur lors de l'ajout du rendez-vous", 'error');
  }
}

async function chargerRendezvous() {
  try {
    const resRdv = await fetch(`${API}/rendezvous`);
    const rdvs = await resRdv.json();

    const resPatients = await fetch(`${API}/patients`);
    const patients = await resPatients.json();

    // Créer un dictionnaire id → nom
    const patientsMap = {};
    patients.forEach(p => patientsMap[p.id] = `${p.nom} ${p.prenom}`);

    document.getElementById('stat-rdv').textContent = rdvs.length;
    document.getElementById('badge-rdv').textContent = rdvs.length;

    const tbody = document.getElementById('liste-rendezvous');
    if (rdvs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty"><i class="fa-solid fa-calendar-xmark"></i><p>Aucun rendez-vous enregistré</p></div></td></tr>`;
      return;
    }

    tbody.innerHTML = rdvs.map(r => `
      <tr>
        <td><strong>${patientsMap[r.patientId] || 'Patient inconnu'}</strong></td>
        <td>${r.medecin}</td>
        <td>${r.date}</td>
        <td>${r.heure}</td>
        <td>${r.motif}</td>
        <td>
          <span class="chip chip-${r.statut === 'en_attente' ? 'warning' : 'success'}">
            <i class="fa-solid fa-circle" style="font-size:8px"></i> ${r.statut}
          </span>
        </td>
        <td>
          <div class="actions">
            <button class="btn btn-warning btn-sm" onclick="modifierRendezvous('${r.id}','${r.patientId}','${r.medecin}','${r.date}','${r.heure}','${r.motif}','${r.statut}')">
              <i class="fa-solid fa-pen"></i> Modifier
            </button>
            <button class="btn btn-danger btn-sm" onclick="supprimerRendezvous('${r.id}')">
              <i class="fa-solid fa-trash"></i> Supprimer
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    document.getElementById('liste-rendezvous').innerHTML = `<tr><td colspan="7"><div class="empty"><i class="fa-solid fa-triangle-exclamation"></i><p>Erreur de connexion</p></div></td></tr>`;
  }
}

function modifierRendezvous(id, patientId, medecin, date, heure, motif, statut) {
  document.getElementById('edit-rdv-id').value = id;
  document.getElementById('edit-rdv-patientId').value = patientId;
  document.getElementById('edit-rdv-medecin').value = medecin;
  document.getElementById('edit-rdv-date').value = date;
  document.getElementById('edit-rdv-heure').value = heure;
  document.getElementById('edit-rdv-motif').value = motif;
  document.getElementById('edit-rdv-statut').value = statut;
  ouvrirModal('modal-rdv');
}

async function sauvegarderRendezvous() {
  const id = document.getElementById('edit-rdv-id').value;
  const data = {
    patientId: document.getElementById('edit-rdv-patientId').value,
    medecin: document.getElementById('edit-rdv-medecin').value,
    date: document.getElementById('edit-rdv-date').value,
    heure: document.getElementById('edit-rdv-heure').value,
    motif: document.getElementById('edit-rdv-motif').value,
    statut: document.getElementById('edit-rdv-statut').value
  };
  try {
    await fetch(`${API}/rendezvous/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    fermerModal('modal-rdv');
    chargerRendezvous();
  } catch (e) {
    alert('Erreur lors de la modification');
  }
}

async function supprimerRendezvous(id) {
  if (!confirm('Supprimer ce rendez-vous ?')) return;
  await fetch(`${API}/rendezvous/${id}`, { method: 'DELETE' });
  chargerRendezvous();
}

// ===================== NOTIFICATIONS =====================

async function chargerNotifications() {
  try {
    const resNotifs = await fetch(`${API}/notifications`);
    const notifs = await resNotifs.json();

    const resPatients = await fetch(`${API}/patients`);
    const patients = await resPatients.json();

    const patientsMap = {};
    patients.forEach(p => patientsMap[p.id] = `${p.nom} ${p.prenom}`);

    document.getElementById('stat-notifs').textContent = notifs.length;
    document.getElementById('badge-notifs').textContent = notifs.length;

    const tbody = document.getElementById('liste-notifications');
    if (notifs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4"><div class="empty"><i class="fa-solid fa-bell-slash"></i><p>Aucune notification</p></div></td></tr>`;
      return;
    }

    tbody.innerHTML = notifs.map(n => `
      <tr>
        <td><strong>${patientsMap[n.patientId] || 'Patient inconnu'}</strong></td>
        <td>${n.message}</td>
        <td><span class="chip chip-primary"><i class="fa-solid fa-tag" style="font-size:10px"></i> ${n.type}</span></td>
        <td>${new Date(n.date).toLocaleString('fr-FR')}</td>
      </tr>
    `).join('');
  } catch (e) {
    document.getElementById('liste-notifications').innerHTML = `<tr><td colspan="4"><div class="empty"><i class="fa-solid fa-triangle-exclamation"></i><p>Erreur de connexion</p></div></td></tr>`;
  }
}

// Charger tout au démarrage
chargerPatients();
chargerRendezvous();
chargerNotifications();