'use strict';

const express = require('express');
const store = require('../lib/store');
const galleryDefault = require('../data/gallery');
const content = require('../lib/content');
const images = require('../lib/images');

const router = express.Router();

const GALLERY_PREVIEW_COUNT = 6;

function galleryCategories(items) {
    return items.reduce(function (list, item) {
        if (item.category && list.indexOf(item.category) === -1) {
            list.push(item.category);
        }
        return list;
    }, []);
}

const PAGES = {
    home: {
        view: 'index',
        path: '/',
        title: 'CMT AVENIR - Chaudronnerie et construction mécanique industrielle',
        description: "CMT AVENIR, entreprise de chaudronnerie industrielle, métallurgie et construction mécanique à Douala (Cameroun). Fabrication, soudure, maintenance."
    },
    about: {
        view: 'about',
        path: '/a-propos',
        title: 'À propos - CMT AVENIR',
        description: "Découvrez CMT AVENIR : notre expertise en chaudronnerie et construction mécanique, notre mission, nos valeurs et notre dirigeant NGUTCHOU TAKOUMBE LUC LEGRAND."
    },
    services: {
        view: 'services',
        path: '/services',
        title: 'Nos services - CMT AVENIR',
        description: 'Chaudronnerie industrielle, construction mécanique, soudure MIG/TIG/ARC, découpe et pliage, cuves et réservoirs, châssis, maintenance industrielle.'
    },
    gallery: {
        view: 'gallery',
        path: '/galerie',
        title: 'Nos réalisations - CMT AVENIR',
        description: 'Nos réalisations en chaudronnerie, soudure et construction mécanique industrielle.'
    },
    partners: {
        view: 'partners',
        path: '/partenaires',
        title: 'Nos partenaires - CMT AVENIR',
        description: 'Les entreprises partenaires de CMT AVENIR.'
    },
    contact: {
        view: 'contact',
        path: '/contact',
        title: 'Contact - CMT AVENIR',
        description: 'Contactez CMT AVENIR à Douala : téléphone, WhatsApp, email et demande de devis en ligne.'
    },
    legal: {
        view: 'legal',
        path: '/mentions-legales',
        title: 'Mentions légales - CMT AVENIR',
        description: "Mentions légales du site de CMT AVENIR : éditeur, hébergement, propriété intellectuelle."
    },
    privacy: {
        view: 'privacy',
        path: '/confidentialite',
        title: 'Politique de confidentialité - CMT AVENIR',
        description: "Politique de confidentialité : quelles données nous collectons via le formulaire de contact et comment elles sont utilisées."
    },
    admin: {
        view: 'admin',
        path: '/admin',
        title: 'Administration - CMT AVENIR',
        description: 'Espace de gestion du site CMT AVENIR.'
    }
};

function baseLocals(page, site, extra) {
    return Object.assign({
        siteName: site.company.name,
        site: site,
        current: page.path,
        title: page.title,
        description: page.description,
        year: new Date().getFullYear()
    }, extra || {});
}

async function renderPage(res, page, extra) {
    const site = await content.getSite();
    res.render(page.view, baseLocals(page, site, extra));
}

async function loadPartners() {
    try {
        return await store.listPartners();
    } catch (err) {
        console.error('[pages] Impossible de charger les partenaires :', err.message);
        return [];
    }
}

/* ------------------------------------------------------------------ */
/* Pages                                                               */
/* ------------------------------------------------------------------ */

router.get(['/', '/accueil'], async (req, res, next) => {
    try {
        await renderPage(res, PAGES.home, {
            partners: await loadPartners(),
            galleryPreview: images.decorateAll(galleryDefault.slice(0, GALLERY_PREVIEW_COUNT)),
            galleryTotal: galleryDefault.length
        });
    } catch (err) { next(err); }
});

router.get('/a-propos', async (req, res, next) => {
    try {
        await renderPage(res, PAGES.about, { ceoImage: images.metaFor('/images/image.jpg') });
    } catch (err) { next(err); }
});

router.get('/services', async (req, res, next) => {
    try {
        await renderPage(res, PAGES.services);
    } catch (err) { next(err); }
});

router.get('/galerie', async (req, res, next) => {
    try {
        await renderPage(res, PAGES.gallery, {
            gallery: images.decorateAll(galleryDefault),
            galleryCategories: galleryCategories(galleryDefault)
        });
    } catch (err) { next(err); }
});

router.get('/partenaires', async (req, res, next) => {
    try {
        await renderPage(res, PAGES.partners, { partners: await loadPartners() });
    } catch (err) { next(err); }
});

router.get('/contact', async (req, res, next) => {
    try {
        await renderPage(res, PAGES.contact, {
            formspreeEndpoint: process.env.FORMSPREE_ENDPOINT || ''
        });
    } catch (err) { next(err); }
});

router.get('/mentions-legales', async (req, res, next) => {
    try {
        await renderPage(res, PAGES.legal);
    } catch (err) { next(err); }
});

router.get('/confidentialite', async (req, res, next) => {
    try {
        await renderPage(res, PAGES.privacy);
    } catch (err) { next(err); }
});

router.get('/admin', async (req, res, next) => {
    try {
        await renderPage(res, PAGES.admin);
    } catch (err) { next(err); }
});

/* ------------------------------------------------------------------ */
/* SEO : robots.txt et sitemap.xml                                     */
/* ------------------------------------------------------------------ */

router.get('/robots.txt', async (req, res, next) => {
    try {
        const site = await content.getSite();
        const base = site.company.url.replace(/\/$/, '');
        res.type('text/plain').send(
            'User-agent: *\n' +
            'Allow: /\n' +
            'Disallow: /admin\n' +
            'Disallow: /api/\n\n' +
            'Sitemap: ' + base + '/sitemap.xml\n'
        );
    } catch (err) { next(err); }
});

router.get('/sitemap.xml', async (req, res, next) => {
    try {
        const site = await content.getSite();
        const base = site.company.url.replace(/\/$/, '');
        const pages = [
            { path: '/', priority: '1.0' },
            { path: '/services', priority: '0.9' },
            { path: '/galerie', priority: '0.9' },
            { path: '/a-propos', priority: '0.8' },
            { path: '/partenaires', priority: '0.7' },
            { path: '/contact', priority: '0.8' },
            { path: '/mentions-legales', priority: '0.3' },
            { path: '/confidentialite', priority: '0.3' }
        ];
        const urls = pages.map(p =>
            '  <url>\n' +
            '    <loc>' + base + p.path + '</loc>\n' +
            '    <changefreq>monthly</changefreq>\n' +
            '    <priority>' + p.priority + '</priority>\n' +
            '  </url>'
        ).join('\n');

        res.type('application/xml').send(
            '<?xml version="1.0" encoding="UTF-8"?>\n' +
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
            urls + '\n' +
            '</urlset>\n'
        );
    } catch (err) { next(err); }
});

/* ------------------------------------------------------------------ */
/* Redirections des anciennes adresses (.html)                         */
/* ------------------------------------------------------------------ */

const LEGACY_ROUTES = {
    '/index.html': '/',
    '/about.html': '/a-propos',
    '/services.html': '/services',
    '/gallery.html': '/galerie',
    '/partners.html': '/partenaires',
    '/contact.html': '/contact',
    '/admin.html': '/admin'
};

Object.keys(LEGACY_ROUTES).forEach(from => {
    router.get(from, (req, res) => res.redirect(301, LEGACY_ROUTES[from]));
});

module.exports = router;
