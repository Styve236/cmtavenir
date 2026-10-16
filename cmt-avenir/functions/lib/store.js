'use strict';

/**
 * Couche de stockage des données.
 *
 * - En production (Cloud Functions) : Firestore.
 * - En local, si Firestore n'est pas disponible : fichier functions/data/dev-db.json
 *   (pratique pour développer ou présenter le site hors-ligne).
 *
 * Toutes les fonctions renvoient des objets de la forme :
 *   { id, name, description, image, url }      -> partenaires
 *   { id, name, email, phone, message, createdAt } -> messages
 */

const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const DEV_DB_FILE = path.join(__dirname, '..', 'data', 'dev-db.json');

/* ------------------------------------------------------------------ */
/* Choix du backend                                                     */
/* ------------------------------------------------------------------ */

function shouldUseFirestore() {
    return Boolean(
        process.env.FIRESTORE_EMULATOR_HOST ||
        process.env.GOOGLE_APPLICATION_CREDENTIALS ||
        process.env.K_SERVICE ||          // Cloud Functions gen2 / Cloud Run
        process.env.FUNCTION_TARGET ||    // Cloud Functions gen1
        process.env.FUNCTIONS_EMULATOR
    );
}

const backend = shouldUseFirestore() ? 'firestore' : 'local';
if (backend === 'local') {
    console.log('[store] Firestore indisponible : utilisation du fichier local ' + DEV_DB_FILE);
}

let firestore = null;
function getFirestore() {
    if (firestore) return firestore;
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
        admin.initializeApp({
            projectId: process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT
        });
    }
    firestore = admin.firestore();
    return firestore;
}

/* ------------------------------------------------------------------ */
/* Backend local (JSON)                                                 */
/* ------------------------------------------------------------------ */

function readLocalDb() {
    try {
        return JSON.parse(fs.readFileSync(DEV_DB_FILE, 'utf8'));
    } catch (e) {
        return { partners: [], messages: [], site: null };
    }
}

function writeLocalDb(db) {
    fs.mkdirSync(path.dirname(DEV_DB_FILE), { recursive: true });
    fs.writeFileSync(DEV_DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

/* ------------------------------------------------------------------ */
/* Partenaires                                                          */
/* ------------------------------------------------------------------ */

async function listPartners() {
    if (backend === 'firestore') {
        const snapshot = await getFirestore().collection('partners').orderBy('createdAt', 'asc').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    return readLocalDb().partners;
}

async function addPartner(partner) {
    const record = {
        name: partner.name,
        description: partner.description,
        image: partner.image || '',
        url: partner.url || '',
        createdAt: new Date().toISOString()
    };

    if (backend === 'firestore') {
        const ref = await getFirestore().collection('partners').add(record);
        return { id: ref.id, ...record };
    }

    const db = readLocalDb();
    const created = { id: randomUUID(), ...record };
    db.partners.push(created);
    writeLocalDb(db);
    return created;
}

async function deletePartner(id) {
    if (backend === 'firestore') {
        await getFirestore().collection('partners').doc(id).delete();
        return true;
    }
    const db = readLocalDb();
    const before = db.partners.length;
    db.partners = db.partners.filter(p => p.id !== id);
    writeLocalDb(db);
    return db.partners.length < before;
}

/* ------------------------------------------------------------------ */
/* Messages de contact                                                  */
/* ------------------------------------------------------------------ */

async function listMessages() {
    if (backend === 'firestore') {
        const snapshot = await getFirestore().collection('messages').orderBy('createdAt', 'desc').limit(100).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    return readLocalDb().messages.slice().reverse();
}

async function addMessage(message) {
    const record = {
        name: message.name,
        email: message.email,
        phone: message.phone || '',
        message: message.message,
        createdAt: new Date().toISOString()
    };

    if (backend === 'firestore') {
        const ref = await getFirestore().collection('messages').add(record);
        return { id: ref.id, ...record };
    }

    const db = readLocalDb();
    const created = { id: randomUUID(), ...record };
    db.messages.push(created);
    writeLocalDb(db);
    return created;
}

async function deleteMessage(id) {
    if (backend === 'firestore') {
        await getFirestore().collection('messages').doc(id).delete();
        return true;
    }
    const db = readLocalDb();
    const before = db.messages.length;
    db.messages = db.messages.filter(m => m.id !== id);
    writeLocalDb(db);
    return db.messages.length < before;
}

/* ------------------------------------------------------------------ */
/* Contenu du site (sections modifiables depuis l'administration)      */
/* ------------------------------------------------------------------ */

const SITE_DOC = 'content';
const SITE_COLLECTION = 'site';

/** Renvoie les sections modifiées, ou null si aucune n'a été enregistrée. */
async function getSiteContent() {
    if (backend === 'firestore') {
        const doc = await getFirestore().collection(SITE_COLLECTION).doc(SITE_DOC).get();
        if (!doc.exists) return null;
        const data = doc.data() || {};
        return data.sections || null;
    }
    return readLocalDb().site || null;
}

/** Enregistre les sections modifiables (serviceGroups, stats, testimonials). */
async function saveSiteContent(sections) {
    const payload = {
        serviceGroups: Array.isArray(sections.serviceGroups) ? sections.serviceGroups : [],
        stats: Array.isArray(sections.stats) ? sections.stats : [],
        testimonials: Array.isArray(sections.testimonials) ? sections.testimonials : [],
        updatedAt: new Date().toISOString()
    };

    if (backend === 'firestore') {
        await getFirestore().collection(SITE_COLLECTION).doc(SITE_DOC).set({ sections: payload });
        return payload;
    }

    const db = readLocalDb();
    db.site = payload;
    writeLocalDb(db);
    return payload;
}

module.exports = {
    backend,
    listPartners,
    addPartner,
    deletePartner,
    listMessages,
    addMessage,
    deleteMessage,
    getSiteContent,
    saveSiteContent
};
