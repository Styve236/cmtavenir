'use strict';

const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cookieSession = require('cookie-session');

const apiRoutes = require('./routes/api');
const pageRoutes = require('./routes/pages');
const site = require('./data/site');
const content = require('./lib/content');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const VIEWS_DIR = path.join(__dirname, 'views');

const SESSION_MAX_AGE = 8 * 60 * 60 * 1000; // 8 heures

/** Version courte des fichiers statiques (cache-busting CSS/JS). */
function computeAssetVersion() {
    const files = ['css/style.css', 'js/main.js', 'js/admin.js'];
    let stamp = 0;
    files.forEach(file => {
        try {
            stamp = Math.max(stamp, fs.statSync(path.join(PUBLIC_DIR, file)).mtimeMs);
        } catch (e) { /* fichier absent : on ignore */ }
    });
    return String(Math.round(stamp)).slice(-8) || '1';
}

function createApp() {
    const app = express();

    const isProduction = Boolean(process.env.K_SERVICE) || process.env.NODE_ENV === 'production';

    let sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret) {
        sessionSecret = 'dev-secret-a-remplacer-en-production';
        console.warn('[app] SESSION_SECRET non défini : utilisation d\'une clé de développement.');
    }

    app.disable('x-powered-by');
    app.set('trust proxy', 1);
    app.set('view engine', 'ejs');
    app.set('views', VIEWS_DIR);

    /* ---------- Sécurité ---------- */
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'", 'https://formspree.io'],
                formAction: ["'self'", 'https://formspree.io'],
                objectSrc: ["'none'"],
                frameSrc: ["'self'", 'https://www.google.com'],
                baseUri: ["'self'"],
                frameAncestors: ["'none'"]
            }
        },
        crossOriginEmbedderPolicy: false
    }));
    app.use(compression());

    /* ---------- Session administrateur (cookie signé, sans serveur d'état) ---------- */
    app.use(cookieSession({
        name: 'cmt.sid',
        keys: [sessionSecret],
        maxAge: SESSION_MAX_AGE,
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction,
        path: '/'
    }));

    /* ---------- Corps des requêtes ---------- */
    app.use(express.json({ limit: '2mb' }));
    app.use(express.urlencoded({ extended: false }));

    /* ---------- Fichiers statiques (en local ; en production c'est Firebase Hosting) ---------- */
    if (fs.existsSync(PUBLIC_DIR)) {
        app.use(express.static(PUBLIC_DIR, { maxAge: isProduction ? '7d' : 0 }));
    }

    /* ---------- Version des assets (cache-busting) ---------- */
    const assetVersion = computeAssetVersion();
    app.use((req, res, next) => {
        res.locals.assetVersion = assetVersion;
        next();
    });

    /* ---------- Routes ---------- */
    app.use('/api', apiRoutes);
    app.use('/', pageRoutes);

    /* ---------- Page 404 ---------- */
    app.use(async (req, res) => {
        if (req.path.indexOf('/api/') === 0) {
            return res.status(404).json({ error: 'Route inconnue.' });
        }
        let merged = site;
        try { merged = await content.getSite(); } catch (e) { /* valeurs par défaut */ }
        res.status(404).render('404', {
            siteName: merged.company.name,
            site: merged,
            current: '/',
            title: 'Page introuvable - CMT AVENIR',
            description: '',
            year: new Date().getFullYear()
        });
    });

    /* ---------- Erreurs ---------- */
    // eslint-disable-next-line no-unused-vars
    app.use(async (err, req, res, next) => {
        console.error('[erreur]', err.message);
        if (req.path.indexOf('/api/') === 0) {
            return res.status(500).json({ error: 'Erreur interne du serveur.' });
        }
        let merged = site;
        try { merged = await content.getSite(); } catch (e) { /* valeurs par défaut */ }
        res.status(500).render('404', {
            siteName: merged.company.name,
            site: merged,
            current: '/',
            title: 'Erreur - CMT AVENIR',
            description: '',
            year: new Date().getFullYear()
        });
    });

    return app;
}

module.exports = { createApp, PUBLIC_DIR };
