'use strict';

/**
 * Amorçage des partenaires de départ.
 *   npm run seed
 *
 * Fonctionne avec Firestore (si configuré) ou avec la base locale
 * functions/data/dev-db.json. À lancer une seule fois : les partenaires
 * ajoutés ensuite depuis /admin ne seront pas écrasés.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const store = require('../functions/lib/store');

const PARTNERS = [
    {
        name: 'NGM INT',
        description: 'Partenaire de CMT AVENIR — catalogue de matériel industriel disponible en ligne.',
        image: '/images/partenaire1.webp',
        url: 'https://ngm-int.com/catalogue-broli-2/?lang=fr'
    },
    {
        name: 'Partenaire 2',
        description: 'Description du partenaire 2.',
        image: '/images/partenaire2.jpg',
        url: ''
    },
    {
        name: 'Partenaire 3',
        description: 'Description du partenaire 3.',
        image: '/images/partenaire3.png',
        url: ''
    }
];

(async function main() {
    console.log('Stockage utilisé : ' + (store.backend === 'firestore' ? 'Firestore' : 'fichier local'));

    const existing = await store.listPartners();
    const known = new Set(existing.map(p => p.name));

    let added = 0;
    for (const partner of PARTNERS) {
        if (known.has(partner.name)) {
            console.log('· déjà présent : ' + partner.name);
            continue;
        }
        await store.addPartner(partner);
        added++;
        console.log('✓ ajouté : ' + partner.name);
    }

    console.log('');
    console.log(added + ' partenaire(s) ajouté(s). Total : ' + (existing.length + added) + '.');
})().catch(err => {
    console.error('Erreur : ' + err.message);
    process.exit(1);
});
