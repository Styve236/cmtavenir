/* =========================================================
   CMT AVENIR — Script principal (front-end)
   ========================================================= */
'use strict';

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- En-tête : hauteur dynamique + état "scrolled" ---------- */
function initHeader() {
    const header = $('header');
    if (!header) return;

    const setHeight = () => {
        document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
    };
    setHeight();
    window.addEventListener('resize', setHeight);

    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
}

/* ---------- Menu mobile ---------- */
function initMenu() {
    const hamburger = $('.hamburger');
    const menu = $('.nav-menu');
    if (!hamburger || !menu) return;

    const setOpen = (open) => {
        menu.classList.toggle('active', open);
        hamburger.classList.toggle('active', open);
        hamburger.setAttribute('aria-expanded', String(open));
        document.body.classList.toggle('menu-open', open);
    };

    hamburger.addEventListener('click', () => setOpen(!menu.classList.contains('active')));

    $$('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => setOpen(false));
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menu.classList.contains('active')) setOpen(false);
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) setOpen(false);
    });
}

/* ---------- Année courante ---------- */
function initYear() {
    const year = String(new Date().getFullYear());
    $$('[data-year]').forEach(el => { el.textContent = year; });
}

/* ---------- Logos partenaires indisponibles ---------- */
function initPartnerLogos() {
    $$('.partner-item img').forEach(img => {
        img.addEventListener('error', () => { img.style.display = 'none'; });
    });
}

/* ---------- Animations d'apparition ponctuelles ---------- */
function initReveal() {
    if (reducedMotion || !('IntersectionObserver' in window)) return;

    const targets = $$('main section, .service-item, .gallery-item, .partner-item, .feature-card, .values-list li');
    if (!targets.length) return;

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(el => {
        el.classList.add('reveal');
        observer.observe(el);
    });
}

/* ---------- Galerie : filtres par catégorie ---------- */
function initGalleryFilter() {
    const bar = $('.filter-bar');
    const grid = $('.gallery-grid');
    if (!bar || !grid) return;

    const chips = $$('.chip', bar);
    const items = $$('.gallery-item', grid);
    if (!chips.length) return;

    const apply = (filter) => {
        items.forEach(item => {
            const match = filter === 'all' || item.dataset.category === filter;
            item.hidden = !match;
        });
    };

    chips.forEach(chip => {
        chip.setAttribute('aria-pressed', String(chip.classList.contains('is-active')));
        chip.addEventListener('click', () => {
            chips.forEach(c => {
                const active = c === chip;
                c.classList.toggle('is-active', active);
                c.setAttribute('aria-pressed', String(active));
            });
            apply(chip.dataset.filter || 'all');
        });
    });
}

/* ---------- Galerie : lightbox accessible ---------- */
function initLightbox() {
    const items = $$('.gallery-item');
    if (!items.length) return;

    const visibleItems = () => items.filter(item => !item.hidden);

    const box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', "Visionneuse d'images");
    box.innerHTML = `
        <button class="lb-btn lb-close" type="button" aria-label="Fermer la visionneuse">&times;</button>
        <button class="lb-btn lb-prev" type="button" aria-label="Image précédente">&#10094;</button>
        <figure class="lb-figure">
            <img src="" alt="">
            <figcaption class="lb-caption"></figcaption>
        </figure>
        <button class="lb-btn lb-next" type="button" aria-label="Image suivante">&#10095;</button>
        <div class="lb-counter" aria-live="polite"></div>`;
    document.body.appendChild(box);

    const img = $('img', box);
    const caption = $('.lb-caption', box);
    const counter = $('.lb-counter', box);
    let index = 0;
    let lastFocus = null;

    const show = (i) => {
        const list = visibleItems();
        if (!list.length) return;
        index = (i + list.length) % list.length;
        const source = $('img', list[index]);
        if (!source) return;
        img.src = source.dataset.full || source.currentSrc || source.src;
        img.alt = source.alt || '';
        const text = list[index].querySelector('p');
        caption.textContent = text ? text.textContent : (source.alt || '');
        counter.textContent = (index + 1) + ' / ' + list.length;
    };

    const open = (i) => {
        lastFocus = document.activeElement;
        show(i);
        box.classList.add('open');
        document.body.style.overflow = 'hidden';
        $('.lb-close', box).focus();
    };

    const close = () => {
        box.classList.remove('open');
        document.body.style.overflow = '';
        if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    };

    items.forEach((item) => {
        const source = $('img', item);
        const label = source && source.alt ? 'Agrandir : ' + source.alt : 'Agrandir la photo';
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.setAttribute('aria-label', label);

        item.addEventListener('click', () => open(visibleItems().indexOf(item)));
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                open(visibleItems().indexOf(item));
            }
        });
    });

    $('.lb-close', box).addEventListener('click', close);
    $('.lb-prev', box).addEventListener('click', () => show(index - 1));
    $('.lb-next', box).addEventListener('click', () => show(index + 1));
    box.addEventListener('click', (e) => { if (e.target === box) close(); });

    document.addEventListener('keydown', (e) => {
        if (!box.classList.contains('open')) return;
        if (e.key === 'Escape') close();
        else if (e.key === 'ArrowRight') show(index + 1);
        else if (e.key === 'ArrowLeft') show(index - 1);
        else if (e.key === 'Tab') {
            const focusables = $$('.lb-btn', box);
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    });

    let touchX = null;
    box.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', (e) => {
        if (touchX === null) return;
        const delta = e.changedTouches[0].clientX - touchX;
        if (Math.abs(delta) > 50) show(index + (delta < 0 ? 1 : -1));
        touchX = null;
    }, { passive: true });
}

/* ---------- Formulaire de contact ---------- */
function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const success = document.getElementById('success-message');
    const error = document.getElementById('error-message');
    const button = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const honeypot = form.querySelector('[name="_gotcha"]');
        if (honeypot && honeypot.value) return;

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const originalText = button ? button.textContent : '';
        if (button) {
            button.disabled = true;
            button.textContent = 'Envoi en cours...';
        }
        if (error) error.hidden = true;

        try {
            const payload = Object.fromEntries(new FormData(form).entries());
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.error || 'Erreur ' + response.status);

            form.reset();
            if (success) {
                success.hidden = false;
                success.setAttribute('tabindex', '-1');
                success.focus();
                setTimeout(() => { success.hidden = true; }, 9000);
            }
        } catch (err) {
            if (error) {
                error.hidden = false;
                error.setAttribute('tabindex', '-1');
                error.focus();
            }
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = originalText;
            }
        }
    });
}

/* ---------- Initialisation ---------- */
document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    initMenu();
    initYear();
    initPartnerLogos();
    initGalleryFilter();
    initLightbox();
    initContactForm();
    initReveal();
});
