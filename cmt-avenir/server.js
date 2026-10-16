'use strict';

/**
 * Serveur local de développement.
 *   npm start        -> http://localhost:3000
 *
 * En production, c'est la fonction Cloud "app" (functions/index.js)
 * qui reçoit les requêtes via Firebase Hosting.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { createApp } = require('./functions/app');
const store = require('./functions/lib/store');

const app = createApp();
const port = process.env.PORT || 3000;

app.listen(port, () => {
    const url = 'http://localhost:' + port;
    console.log('');
    console.log('  CMT AVENIR - serveur de développement');
    console.log('  Site web        : ' + url);
    console.log('  Administration  : ' + url + '/admin');
    console.log('  Stockage        : ' + (store.backend === 'firestore' ? 'Firestore' : 'fichier local (functions/data/dev-db.json)'));
    console.log('');
});
