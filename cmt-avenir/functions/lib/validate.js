'use strict';

const MAX_IMAGE_CHARS = 700000; // ~525 Ko d'image réelle (limite Firestore : 1 Mo/doc)

function cleanString(value, maxLength = 500) {
    if (typeof value !== 'string') return '';
    return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value);
}

function isImageDataUrl(value) {
    return typeof value === 'string' && /^data:image\/(png|jpe?g|webp|gif);base64,/.test(value);
}

function validatePartner(payload) {
    const data = {
        name: cleanString(payload && payload.name, 80),
        description: cleanString(payload && payload.description, 300),
        url: cleanString(payload && payload.url, 300),
        image: typeof (payload && payload.image) === 'string' ? payload.image.trim() : ''
    };
    const errors = [];

    if (data.name.length < 2) errors.push('Le nom du partenaire est trop court.');
    if (data.description.length < 2) errors.push('La description est trop courte.');
    if (data.image && !isImageDataUrl(data.image) && !/^https?:\/\//.test(data.image)) {
        errors.push("L'image doit être un fichier image ou une URL valide.");
    }
    if (data.image.length > MAX_IMAGE_CHARS) {
        errors.push('Image trop lourde : réduisez-la ou choisissez un autre fichier.');
    }
    if (data.url && !/^https?:\/\//.test(data.url)) errors.push('Le lien du site doit commencer par http(s)://');

    return { valid: errors.length === 0, errors, data };
}

function validateMessage(payload) {
    const data = {
        name: cleanString(payload && payload.name, 80),
        email: cleanString(payload && payload.email, 120),
        phone: cleanString(payload && payload.phone, 40),
        message: cleanString(payload && payload.message, 2000)
    };
    const errors = [];

    if (data.name.length < 2) errors.push('Veuillez indiquer votre nom.');
    if (!isEmail(data.email)) errors.push('Adresse email invalide.');
    if (data.message.length < 10) errors.push('Votre message est trop court (10 caractères minimum).');

    return { valid: errors.length === 0, errors, data };
}

/* ------------------------------------------------------------------ */
/* Contenu du site (admin : services, chiffres clés, témoignages)      */
/* ------------------------------------------------------------------ */

const MAX_LIST = 12;

function cleanLines(value, maxItems) {
    const raw = Array.isArray(value) ? value : String(value || '').split('\n');
    return raw
        .map(line => cleanString(line, 160))
        .filter(Boolean)
        .slice(0, maxItems || MAX_LIST);
}

function validateSiteContent(payload) {
    const errors = [];
    const body = payload || {};

    const serviceGroups = (Array.isArray(body.serviceGroups) ? body.serviceGroups : [])
        .slice(0, MAX_LIST)
        .map(group => ({
            title: cleanString(group && group.title, 80),
            summary: cleanString(group && group.summary, 300),
            points: cleanLines(group && group.points)
        }))
        .filter(group => group.title);

    const stats = (Array.isArray(body.stats) ? body.stats : [])
        .slice(0, MAX_LIST)
        .map(stat => ({
            value: cleanString(stat && stat.value, 40),
            label: cleanString(stat && stat.label, 80)
        }))
        .filter(stat => stat.value && stat.label);

    const testimonials = (Array.isArray(body.testimonials) ? body.testimonials : [])
        .slice(0, MAX_LIST)
        .map(item => ({
            quote: cleanString(item && item.quote, 600),
            name: cleanString(item && item.name, 80),
            role: cleanString(item && item.role, 120)
        }))
        .filter(item => item.quote && item.name);

    if (!serviceGroups.length) errors.push('Ajoutez au moins une prestation.');

    return { valid: errors.length === 0, errors, data: { serviceGroups, stats, testimonials } };
}

module.exports = {
    cleanString,
    isEmail,
    isImageDataUrl,
    validatePartner,
    validateMessage,
    validateSiteContent,
    MAX_IMAGE_CHARS
};
