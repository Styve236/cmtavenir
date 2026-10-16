'use strict';

const bcrypt = require('bcryptjs');

/**
 * Vérifie le mot de passe administrateur.
 * - En production : comparaison avec ADMIN_PASSWORD_HASH (bcrypt).
 * - En local sans hash : ADMIN_PASSWORD ou mot de passe par défaut (à changer).
 */
async function checkPassword(password) {
    if (typeof password !== 'string' || password.length === 0) return false;

    const hash = process.env.ADMIN_PASSWORD_HASH;
    if (hash) return bcrypt.compare(password, hash);

    const fallback = process.env.ADMIN_PASSWORD || 'CMT2025';
    if (!process.env.ADMIN_PASSWORD && !hash) {
        console.warn('[auth] ADMIN_PASSWORD_HASH non défini : mot de passe par défaut utilisé. À changer avant la mise en ligne !');
    }
    return password === fallback;
}

function requireAdmin(req, res, next) {
    if (req.session && req.session.admin === true) return next();
    return res.status(401).json({ error: 'Authentification requise.' });
}

/** Bloque les requêtes de modification provenant d'un autre site (protection CSRF simple). */
function sameOrigin(req, res, next) {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();

    const source = req.get('origin') || req.get('referer');
    if (!source) return next();

    try {
        if (new URL(source).host === req.get('host')) return next();
    } catch (e) { /* en-tête illisible : on refuse */ }

    return res.status(403).json({ error: 'Origine non autorisée.' });
}

module.exports = { checkPassword, requireAdmin, sameOrigin };
