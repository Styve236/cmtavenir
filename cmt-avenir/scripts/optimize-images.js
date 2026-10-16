'use strict';

/**
 * Optimisation des images : WebP + miniatures + manifeste.
 *
 * Usage : npm run images
 *
 * Pour chaque JPG/PNG de public/images/ :
 *   - génère une version WebP (public/images/<nom>.webp)
 *   - génère une miniature WebP 600px (public/images/thumbs/<nom>.webp)
 *   - enregistre les dimensions dans public/images/manifest.json
 *
 * Le manifeste est lu par functions/lib/images.js pour servir les bonnes
 * versions dans les gabarits (<picture>). S'il n'existe pas, le site utilise
 * les images d'origine : rien ne casse.
 */

const fs = require('fs');
const path = require('path');

let sharp;
try {
    sharp = require('sharp');
} catch (e) {
    console.error('[images] Le module "sharp" est requis. Installez-le avec : npm install --save-dev sharp');
    process.exit(1);
}

const ROOT = path.join(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'public', 'images');
const THUMBS_DIR = path.join(IMAGES_DIR, 'thumbs');
const MANIFEST_FILE = path.join(IMAGES_DIR, 'manifest.json');

const SOURCE_RE = /\.(jpe?g|png)$/i;
const WEBP_QUALITY = 78;
const THUMB_WIDTH = 600;

function ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true });
}

function newerThan(file, reference) {
    try {
        return fs.statSync(file).mtimeMs >= fs.statSync(reference).mtimeMs;
    } catch (e) {
        return false;
    }
}

async function buildOne(fileName) {
    const sourcePath = path.join(IMAGES_DIR, fileName);
    const base = fileName.replace(SOURCE_RE, '');
    const webpName = base + '.webp';
    const webpPath = path.join(IMAGES_DIR, webpName);
    const thumbName = base + '.webp';
    const thumbPath = path.join(THUMBS_DIR, thumbName);

    const image = sharp(sourcePath, { failOn: 'none' });
    const metadata = await image.metadata();

    if (!newerThan(webpPath, sourcePath)) {
        await image.clone().webp({ quality: WEBP_QUALITY }).toFile(webpPath);
    }
    if (!newerThan(thumbPath, sourcePath)) {
        await image.clone()
            .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
            .webp({ quality: WEBP_QUALITY })
            .toFile(thumbPath);
    }

    return {
        key: fileName,
        entry: {
            webp: webpName,
            thumb: 'thumbs/' + thumbName,
            width: metadata.width || null,
            height: metadata.height || null
        }
    };
}

async function buildAppleTouchIcon() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="#1E40AF"/>
        <text x="50" y="72" font-size="62" font-family="Arial, sans-serif" font-weight="bold"
              text-anchor="middle" fill="#F97316">C</text>
    </svg>`;
    const target = path.join(IMAGES_DIR, 'apple-touch-icon.png');
    await sharp(Buffer.from(svg)).resize(180, 180).png().toFile(target);
    return 'apple-touch-icon.png';
}

function checkGalleryCase() {
    // Vérifie que chaque image référencée dans la galerie existe (casse exacte).
    let gallery;
    try {
        gallery = require(path.join(ROOT, 'functions', 'data', 'gallery.js'));
    } catch (e) {
        return [];
    }
    const files = new Set(fs.readdirSync(IMAGES_DIR));
    return gallery
        .map(item => item.image)
        .filter(image => image && image.indexOf('/images/') === 0)
        .map(image => image.replace('/images/', ''))
        .filter(name => !files.has(name));
}

async function main() {
    if (!fs.existsSync(IMAGES_DIR)) {
        console.error('[images] Dossier introuvable : ' + IMAGES_DIR);
        process.exit(1);
    }
    ensureDir(THUMBS_DIR);

    const files = fs.readdirSync(IMAGES_DIR).filter(f => SOURCE_RE.test(f));
    console.log('[images] ' + files.length + ' image(s) à traiter…');

    const manifest = {};
    for (const file of files) {
        try {
            const { key, entry } = await buildOne(file);
            manifest[key] = entry;
            console.log('  ✓ ' + file + ' → ' + entry.webp + ' (miniature ' + entry.thumb + ')');
        } catch (err) {
            console.warn('  ✗ ' + file + ' : ' + err.message);
        }
    }

    fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2), 'utf8');
    console.log('[images] Manifeste écrit : ' + path.relative(ROOT, MANIFEST_FILE));

    try {
        const icon = await buildAppleTouchIcon();
        console.log('[images] Icône iOS générée : ' + icon);
    } catch (err) {
        console.warn('[images] Icône iOS non générée : ' + err.message);
    }

    const missing = checkGalleryCase();
    if (missing.length) {
        console.warn('\n[images] ⚠ Images référencées mais introuvables (attention à la casse) :');
        missing.forEach(name => console.warn('   - ' + name));
    } else {
        console.log('[images] Toutes les images de la galerie existent (casse correcte).');
    }

    console.log('\n[images] Terminé.');
}

main().catch(err => {
    console.error('[images] Erreur :', err);
    process.exit(1);
});
