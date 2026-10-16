'use strict';

/**
 * Point d'entrée déployé sur Firebase Cloud Functions (génération 2).
 * L'application Express complète est exposée derrière Firebase Hosting
 * grâce à la règle "rewrites" de firebase.json.
 */

const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');

const { createApp } = require('./app');

const SESSION_SECRET = defineSecret('SESSION_SECRET');
const ADMIN_PASSWORD_HASH = defineSecret('ADMIN_PASSWORD_HASH');
const GMAIL_APP_PASSWORD = defineSecret('GMAIL_APP_PASSWORD');

// L'application est construite au premier appel, une fois les secrets injectés
// dans l'environnement d'exécution.
let appPromise = null;
function getApp() {
    if (!appPromise) appPromise = Promise.resolve(createApp());
    return appPromise;
}

exports.app = onRequest({
    region: 'europe-west1',
    memory: '256MiB',
    timeoutSeconds: 30,
    maxInstances: 10,
    secrets: [SESSION_SECRET, ADMIN_PASSWORD_HASH, GMAIL_APP_PASSWORD]
}, async (req, res) => {
    const app = await getApp();
    app(req, res);
});
