'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');

const { checkPassword, requireAdmin, sameOrigin } = require('../middleware/auth');
const store = require('../lib/store');
const content = require('../lib/content');
const { validatePartner, validateMessage, validateSiteContent } = require('../lib/validate');
const { deliverContact } = require('../lib/mailer');

const router = express.Router();

/* ------------------------------------------------------------------ */
/* Limitation du nombre de requêtes (anti-spam / anti-bruteforce)       */
/* ------------------------------------------------------------------ */

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' }
});

const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 8,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Trop de messages envoyés. Merci de réessayer plus tard ou de nous appeler.' }
});

const adminLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Trop de requêtes, patientez quelques secondes.' }
});

router.use(sameOrigin);

/* ------------------------------------------------------------------ */
/* Routes publiques                                                    */
/* ------------------------------------------------------------------ */

router.get('/health', (req, res) => {
    res.json({ ok: true, storage: store.backend, time: new Date().toISOString() });
});

router.get('/partners', async (req, res, next) => {
    try {
        res.json({ partners: await store.listPartners() });
    } catch (err) {
        next(err);
    }
});

router.post('/contact', contactLimiter, async (req, res, next) => {
    try {
        // Pot de miel : rempli uniquement par les robots.
        if (req.body && typeof req.body._gotcha === 'string' && req.body._gotcha !== '') {
            return res.status(200).json({ ok: true });
        }

        const { valid, errors, data } = validateMessage(req.body);
        if (!valid) return res.status(400).json({ error: errors.join(' ') });

        const saved = await store.addMessage(data);
        const delivery = await deliverContact(data);

        if (!delivery.delivered && delivery.errors.length) {
            console.warn('[contact] envoi impossible :', delivery.errors.join(' | '));
        }

        res.status(201).json({ ok: true, id: saved.id, delivered: delivery.delivered, via: delivery.via });
    } catch (err) {
        next(err);
    }
});

/* ------------------------------------------------------------------ */
/* Authentification administrateur                                     */
/* ------------------------------------------------------------------ */

router.post('/admin/login', loginLimiter, async (req, res, next) => {
    try {
        const ok = await checkPassword(req.body && req.body.password);
        if (!ok) return res.status(401).json({ error: 'Mot de passe incorrect.' });
        req.session.admin = true;
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
});

router.post('/admin/logout', (req, res) => {
    req.session = null;
    res.json({ ok: true });
});

router.get('/admin/session', (req, res) => {
    res.json({ authenticated: Boolean(req.session && req.session.admin === true) });
});

/* ------------------------------------------------------------------ */
/* Partenaires (administration)                                        */
/* ------------------------------------------------------------------ */

router.get('/admin/partners', requireAdmin, async (req, res, next) => {
    try {
        res.json({ partners: await store.listPartners() });
    } catch (err) {
        next(err);
    }
});

router.post('/admin/partners', requireAdmin, adminLimiter, async (req, res, next) => {
    try {
        const { valid, errors, data } = validatePartner(req.body);
        if (!valid) return res.status(400).json({ error: errors.join(' ') });

        const partner = await store.addPartner(data);
        res.status(201).json({ ok: true, partner });
    } catch (err) {
        next(err);
    }
});

router.delete('/admin/partners/:id', requireAdmin, async (req, res, next) => {
    try {
        const deleted = await store.deletePartner(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'Partenaire introuvable.' });
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
});

/* ------------------------------------------------------------------ */
/* Messages (administration)                                           */
/* ------------------------------------------------------------------ */

router.get('/admin/messages', requireAdmin, async (req, res, next) => {
    try {
        res.json({ messages: await store.listMessages() });
    } catch (err) {
        next(err);
    }
});

router.delete('/admin/messages/:id', requireAdmin, async (req, res, next) => {
    try {
        const deleted = await store.deleteMessage(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'Message introuvable.' });
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
});

/* ------------------------------------------------------------------ */
/* Contenu du site (administration)                                    */
/* ------------------------------------------------------------------ */

router.get('/admin/content', requireAdmin, async (req, res, next) => {
    try {
        const site = await content.getSite();
        res.json({
            content: {
                serviceGroups: site.serviceGroups,
                stats: site.stats,
                testimonials: site.testimonials
            }
        });
    } catch (err) {
        next(err);
    }
});

router.put('/admin/content', requireAdmin, adminLimiter, async (req, res, next) => {
    try {
        const { valid, errors, data } = validateSiteContent(req.body);
        if (!valid) return res.status(400).json({ error: errors.join(' ') });

        await store.saveSiteContent(data);
        content.invalidate();
        res.json({ ok: true, content: data });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
