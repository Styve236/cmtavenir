/* =========================================================
   CMT AVENIR — Administration (partenaires + messages)
   ========================================================= */
'use strict';

(function () {
    const gate = document.getElementById('admin-gate');
    const panel = document.getElementById('admin-panel');
    if (!gate || !panel) return;

    const loginForm = document.getElementById('admin-login');
    const passwordInput = document.getElementById('admin-password');
    const loginError = document.getElementById('admin-error');
    const logoutBtn = document.getElementById('admin-logout');

    const addForm = document.getElementById('add-partner-form');
    const fileInput = document.getElementById('partner-image');
    const preview = document.getElementById('preview');
    const partnerError = document.getElementById('partner-error');

    const partnersList = document.getElementById('partners-admin-list');
    const messagesList = document.getElementById('messages-admin-list');

    const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
    const MAX_IMAGE_SIDE = 800;

    /* ---------- Appels API ---------- */
    async function api(url, options) {
        const response = await fetch(url, Object.assign({
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
        }, options || {}));
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Erreur ' + response.status);
        return data;
    }

    /* ---------- Redimensionnement de l'image du logo ---------- */
    function processImageFile(file) {
        return new Promise((resolve, reject) => {
            if (!file) return reject(new Error('Veuillez choisir une image.'));
            if (!file.type.startsWith('image/')) return reject(new Error("Ce fichier n'est pas une image."));
            if (file.size > MAX_IMAGE_SIZE) return reject(new Error("L'image dépasse la taille maximale de 5 Mo."));

            const reader = new FileReader();
            reader.onerror = () => reject(new Error('Impossible de lire le fichier.'));
            reader.onload = () => {
                const source = new Image();
                source.onerror = () => reject(new Error('Image illisible.'));
                source.onload = () => {
                    let width = source.naturalWidth;
                    let height = source.naturalHeight;
                    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(width, height));
                    width = Math.round(width * scale);
                    height = Math.round(height * scale);

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(source, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.82));
                };
                source.src = reader.result;
            };
            reader.readAsDataURL(file);
        });
    }

    /* ---------- Affichage ---------- */
    function renderPartners(partners) {
        partnersList.innerHTML = '';
        const heading = document.createElement('h3');
        heading.textContent = 'Partenaires affichés (' + partners.length + ')';
        partnersList.appendChild(heading);

        if (!partners.length) {
            const hint = document.createElement('p');
            hint.className = 'admin-note';
            hint.textContent = 'Aucun partenaire pour le moment.';
            partnersList.appendChild(hint);
            return;
        }

        partners.forEach(partner => {
            const row = document.createElement('div');
            row.className = 'partner-admin-item';

            const info = document.createElement('div');
            info.className = 'pa-info';

            if (partner.image) {
                const img = document.createElement('img');
                img.src = partner.image;
                img.alt = '';
                img.addEventListener('error', () => { img.style.display = 'none'; });
                info.appendChild(img);
            }

            const text = document.createElement('div');
            text.className = 'pa-text';

            const title = document.createElement('h4');
            title.textContent = partner.name;
            const desc = document.createElement('p');
            desc.textContent = partner.description || '';
            text.append(title, desc);
            info.appendChild(text);
            row.appendChild(info);

            const del = document.createElement('button');
            del.type = 'button';
            del.textContent = 'Supprimer';
            del.addEventListener('click', () => removePartner(partner));
            row.appendChild(del);

            partnersList.appendChild(row);
        });
    }

    function renderMessages(messages) {
        messagesList.innerHTML = '';
        const heading = document.createElement('h3');
        heading.textContent = 'Messages reçus (' + messages.length + ')';
        messagesList.appendChild(heading);

        if (!messages.length) {
            const hint = document.createElement('p');
            hint.className = 'admin-note';
            hint.textContent = 'Aucun message reçu pour le moment.';
            messagesList.appendChild(hint);
            return;
        }

        messages.forEach(message => {
            const row = document.createElement('div');
            row.className = 'partner-admin-item';

            const info = document.createElement('div');
            info.className = 'pa-text';

            const title = document.createElement('h4');
            title.textContent = message.name + ' — ' + message.email;

            const meta = document.createElement('p');
            const date = message.createdAt ? new Date(message.createdAt).toLocaleString('fr-FR') : '';
            meta.textContent = [message.phone, date].filter(Boolean).join(' • ');

            const body = document.createElement('p');
            body.textContent = message.message;
            body.style.whiteSpace = 'pre-wrap';

            info.append(title, meta, body);
            row.appendChild(info);

            const del = document.createElement('button');
            del.type = 'button';
            del.textContent = 'Supprimer';
            del.addEventListener('click', () => removeMessage(message));
            row.appendChild(del);

            messagesList.appendChild(row);
        });
    }

    /* ---------- Chargements ---------- */
    async function loadPartners() {
        const data = await api('/api/admin/partners');
        renderPartners(data.partners || []);
    }

    async function loadMessages() {
        const data = await api('/api/admin/messages');
        renderMessages(data.messages || []);
    }

    async function loadAll() {
        try {
            await Promise.all([loadPartners(), loadMessages()]);
        } catch (err) {
            console.error(err);
        }
        await loadContent();
    }

    /* ---------- Actions ---------- */
    async function removePartner(partner) {
        if (!window.confirm('Supprimer le partenaire « ' + partner.name + ' » ?')) return;
        try {
            await api('/api/admin/partners/' + encodeURIComponent(partner.id), { method: 'DELETE' });
            await loadPartners();
        } catch (err) {
            window.alert(err.message);
        }
    }

    async function removeMessage(message) {
        if (!window.confirm('Supprimer ce message de ' + message.name + ' ?')) return;
        try {
            await api('/api/admin/messages/' + encodeURIComponent(message.id), { method: 'DELETE' });
            await loadMessages();
        } catch (err) {
            window.alert(err.message);
        }
    }

    function showPanel() {
        gate.hidden = true;
        panel.hidden = false;
        loadAll();
    }

    function showGate() {
        panel.hidden = true;
        gate.hidden = false;
        if (passwordInput) {
            passwordInput.value = '';
            passwordInput.focus();
        }
    }

    /* ---------- Événements ---------- */
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        loginError.hidden = true;
        try {
            await api('/api/admin/login', {
                method: 'POST',
                body: JSON.stringify({ password: passwordInput.value })
            });
            showPanel();
        } catch (err) {
            loginError.hidden = false;
            passwordInput.value = '';
            passwordInput.focus();
        }
    });

    logoutBtn.addEventListener('click', async () => {
        try {
            await api('/api/admin/logout', { method: 'POST', body: JSON.stringify({}) });
        } catch (err) { /* on ignore */ }
        showGate();
    });

    if (fileInput && preview) {
        fileInput.addEventListener('change', () => {
            const file = fileInput.files[0];
            if (!file) {
                preview.style.display = 'none';
                preview.removeAttribute('src');
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        });
    }

    addForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        partnerError.hidden = true;

        const submitBtn = addForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Ajout en cours...';

        try {
            const image = fileInput.files.length ? await processImageFile(fileInput.files[0]) : '';
            await api('/api/admin/partners', {
                method: 'POST',
                body: JSON.stringify({
                    name: addForm.name.value,
                    description: addForm.description.value,
                    url: addForm.url.value,
                    image: image
                })
            });
            addForm.reset();
            if (preview) {
                preview.style.display = 'none';
                preview.removeAttribute('src');
            }
            await loadPartners();
        } catch (err) {
            partnerError.textContent = err.message;
            partnerError.hidden = false;
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });

    /* ---------- Éditeur de contenu (stats, témoignages, prestations) ---------- */
    const contentForm = document.getElementById('content-form');
    const statsEditor = document.getElementById('stats-editor');
    const testimonialsEditor = document.getElementById('testimonials-editor');
    const servicesEditor = document.getElementById('services-editor');
    const contentError = document.getElementById('content-error');
    const contentSuccess = document.getElementById('content-success');

    function makeField(labelText, tag, value, placeholder) {
        const wrap = document.createElement('label');
        wrap.className = 'editor-field';
        wrap.appendChild(document.createTextNode(labelText));
        const input = document.createElement(tag);
        if (tag === 'textarea') input.rows = 3;
        input.value = value || '';
        if (placeholder) input.placeholder = placeholder;
        wrap.appendChild(input);
        return input;
    }

    function makeRemoveButton(row) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'editor-remove';
        btn.textContent = 'Supprimer';
        btn.addEventListener('click', () => row.remove());
        return btn;
    }

    function createRow(container, data) {
        const row = document.createElement('div');
        row.className = 'editor-row';
        let read;

        if (container === statsEditor) {
            const value = makeField('Valeur', 'input', data.value, 'ex. 15+');
            const label = makeField('Libellé', 'input', data.label, 'ex. Années d\'expérience');
            read = () => ({ value: value.value, label: label.value });
            row.append(value.parentNode, label.parentNode);
        } else if (container === testimonialsEditor) {
            const quote = makeField('Citation', 'textarea', data.quote, 'Ce que le client a dit…');
            const name = makeField('Nom', 'input', data.name, 'Prénom Nom');
            const role = makeField('Fonction / société', 'input', data.role, 'ex. Directeur, Société');
            read = () => ({ quote: quote.value, name: name.value, role: role.value });
            row.append(quote.parentNode, name.parentNode, role.parentNode);
        } else {
            const title = makeField('Titre', 'input', data.title, 'ex. Chaudronnerie industrielle');
            const summary = makeField('Résumé', 'textarea', data.summary, 'Courte description de la prestation…');
            const points = makeField('Détails (une ligne par point)', 'textarea', (data.points || []).join('\n'), 'Ex : Cuves et réservoirs');
            read = () => ({
                title: title.value,
                summary: summary.value,
                points: points.value.split('\n').map(line => line.trim()).filter(Boolean)
            });
            row.append(title.parentNode, summary.parentNode, points.parentNode);
        }

        row.appendChild(makeRemoveButton(row));
        row._read = read;
        container.appendChild(row);
        return row;
    }

    function renderEditor(container, items) {
        container.innerHTML = '';
        items.forEach(item => createRow(container, item));
    }

    function readEditor(container) {
        return Array.from(container.children)
            .map(row => (typeof row._read === 'function' ? row._read() : null))
            .filter(Boolean);
    }

    async function loadContent() {
        if (!contentForm) return;
        try {
            const data = await api('/api/admin/content');
            const content = data.content || {};
            renderEditor(statsEditor, content.stats || []);
            renderEditor(testimonialsEditor, content.testimonials || []);
            renderEditor(servicesEditor, content.serviceGroups || []);
        } catch (err) {
            console.error(err);
        }
    }

    if (contentForm) {
        document.querySelectorAll('[data-add]').forEach(btn => {
            btn.addEventListener('click', () => {
                const map = { stats: statsEditor, testimonials: testimonialsEditor, services: servicesEditor };
                createRow(map[btn.dataset.add], {});
            });
        });

        contentForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            contentError.hidden = true;
            contentSuccess.hidden = true;

            const submitBtn = contentForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enregistrement…';

            try {
                await api('/api/admin/content', {
                    method: 'PUT',
                    body: JSON.stringify({
                        stats: readEditor(statsEditor),
                        testimonials: readEditor(testimonialsEditor),
                        serviceGroups: readEditor(servicesEditor)
                    })
                });
                contentSuccess.hidden = false;
            } catch (err) {
                contentError.textContent = err.message;
                contentError.hidden = false;
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }

    /* ---------- Vérification de session au chargement ---------- */
    api('/api/admin/session')
        .then(data => {
            if (data.authenticated) showPanel();
            else showGate();
        })
        .catch(() => showGate());
})();