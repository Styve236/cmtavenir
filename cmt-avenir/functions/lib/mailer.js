'use strict';

/**
 * Envoi des messages de contact.
 *
 * 1. Email direct via Nodemailer (Gmail SMTP) si GMAIL_USER + GMAIL_APP_PASSWORD sont définis.
 * 2. Sinon (ou en cas d'échec) : relais vers Formspree si FORMSPREE_ENDPOINT est défini.
 *
 * Dans tous les cas le message est déjà enregistré dans Firestore par l'API.
 */

async function sendWithGmail(message) {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;
    if (!user || !pass) return { skipped: true };

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass }
    });

    await transporter.sendMail({
        from: '"Site CMT AVENIR" <' + user + '>',
        to: process.env.CONTACT_TO || user,
        replyTo: message.email,
        subject: 'Nouveau message du site - ' + message.name,
        text: [
            'Nom : ' + message.name,
            'Email : ' + message.email,
            'Téléphone : ' + (message.phone || 'non renseigné'),
            '',
            message.message
        ].join('\n')
    });

    return { sent: true };
}

async function sendWithFormspree(message) {
    const endpoint = process.env.FORMSPREE_ENDPOINT;
    if (!endpoint) return { skipped: true };

    const body = new FormData();
    body.append('name', message.name);
    body.append('email', message.email);
    body.append('phone', message.phone || '');
    body.append('message', message.message);

    const response = await fetch(endpoint, { method: 'POST', body, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Formspree a répondu ' + response.status);
    return { sent: true };
}

/**
 * @returns {Promise<{ delivered: boolean, via: string|null, errors: string[] }>}
 */
async function deliverContact(message) {
    const errors = [];

    try {
        const result = await sendWithGmail(message);
        if (result.sent) return { delivered: true, via: 'gmail', errors };
    } catch (err) {
        errors.push('gmail: ' + err.message);
    }

    try {
        const result = await sendWithFormspree(message);
        if (result.sent) return { delivered: true, via: 'formspree', errors };
    } catch (err) {
        errors.push('formspree: ' + err.message);
    }

    return { delivered: false, via: null, errors };
}

module.exports = { deliverContact };
