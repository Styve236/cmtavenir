'use strict';

/**
 * Contenu du site : fusionne les valeurs par défaut (data/site.js)
 * avec les éventuelles modifications enregistrées depuis l'administration.
 *
 * Les sections modifiables via /admin sont : serviceGroups, stats, testimonials.
 * Le reste (coordonnées, etc.) reste défini dans data/site.js.
 */

const defaults = require('../data/site');
const store = require('./store');

const EDITABLE_KEYS = ['serviceGroups', 'stats', 'testimonials'];

let cache = null;

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function merge(overrides) {
    const site = clone(defaults);
    if (overrides && typeof overrides === 'object') {
        EDITABLE_KEYS.forEach(key => {
            if (Array.isArray(overrides[key])) site[key] = overrides[key];
        });
    }
    return site;
}

/** Renvoie le contenu fusionné (avec cache mémoire). */
async function getSite() {
    if (cache) return cache;
    let overrides = null;
    try {
        overrides = await store.getSiteContent();
    } catch (err) {
        console.warn('[content] contenu administrable indisponible :', err.message);
    }
    cache = merge(overrides);
    return cache;
}

/** Vide le cache (à appeler après une modification depuis l'admin). */
function invalidate() {
    cache = null;
}

module.exports = { getSite, invalidate, EDITABLE_KEYS, defaults };
