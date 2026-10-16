'use strict';

/**
 * Génère le hash bcrypt du mot de passe administrateur.
 *   npm run hash-password -- "MonMotDePasse"
 * Copiez ensuite la valeur dans la variable ADMIN_PASSWORD_HASH
 * (fichier .env en local, secret Firebase en production).
 */

const bcrypt = require('../functions/node_modules/bcryptjs');

const password = process.argv[2];

if (!password) {
    console.error('Usage : npm run hash-password -- "MonMotDePasse"');
    process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
console.log('');
console.log('Hash bcrypt :');
console.log(hash);
console.log('');
console.log('Local  -> ajoutez cette ligne dans .env :');
console.log('ADMIN_PASSWORD_HASH=' + hash);
console.log('Firebase -> firebase functions:secrets:set ADMIN_PASSWORD_HASH');
