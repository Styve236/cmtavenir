'use strict';

/**
 * Métadonnées des images optimisées (WebP + miniatures).
 *
 * Le script `npm run images` génère public/images/manifest.json :
 *   { "image1.jpg": { "webp": "image1.webp", "thumb": "thumbs/image1.webp", "width": 1600, "height": 1200 } }
 *
 * Si le manifeste n'existe pas (images non optimisées), tout continue de
 * fonctionner avec les fichiers JPG d'origine.
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', '..', 'public');
const MANIFEST_FILE = path.join(PUBLIC_DIR, 'images', 'manifest.json');

let manifest = null;
let loaded = false;

function load() {
    if (loaded) return;
    loaded = true;
    try {
        manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
    } catch (e) {
        manifest = null;
    }
}

/** Retourne { webp, thumb, width, height } pour un chemin d'image, ou null. */
function metaFor(imagePath) {
    load();
    if (!manifest || typeof imagePath !== 'string') return null;
    const entry = manifest[path.basename(imagePath)];
    if (!entry) return null;
    return {
        webp: entry.webp ? '/images/' + entry.webp : null,
        thumb: entry.thumb ? '/images/' + entry.thumb : null,
        width: entry.width || null,
        height: entry.height || null
    };
}

/** Ajoute un champ `meta` à un élément de galerie si disponible. */
function decorate(item) {
    const meta = metaFor(item.image);
    return meta ? Object.assign({}, item, { meta: meta }) : item;
}

function decorateAll(items) {
    return items.map(decorate);
}

module.exports = { metaFor, decorate, decorateAll };
