'use strict';

/**
 * ============================================================================
 *  CONTENU ÉDITABLE DU SITE
 *  Tout le texte « modifiable » du site est regroupé ici : coordonnées,
 *  statistiques, prestations, témoignages, réseaux sociaux.
 *  Modifiez ce fichier, pas les gabarits EJS.
 * ============================================================================
 */

module.exports = {
    company: {
        name: 'CMT AVENIR',
        // Adresse publique du site (utilisée pour le SEO : canonical, sitemap, partage).
        // ⚠️ Remplacez par votre vrai domaine une fois en ligne (ex. https://cmt-avenir.com).
        url: 'https://cmt-avenir.web.app',
        tagline: 'Chaudronnerie & construction mécanique industrielle',
        slogan: "Let's build the future",
        founder: 'NGUTCHOU TAKOUMBE LUC LEGRAND',
        address: 'Douala, Cameroun',
        hours: 'Lundi – Vendredi : 8h – 18h',
        phones: [
            '+237 6 55 05 22 58'
        ],
        emails: [
            'tefogangstevelandry@gmail.com'
        ],
        whatsapp: '237655052258',
        whatsappMessage: "Bonjour, je souhaite obtenir plus d'informations sur vos services.",
        // Remplissez ces liens si vous avez des pages (sinon laissez vide : les icônes n'apparaîtront pas)
        social: {
            facebook: '',
            instagram: '',
            linkedin: '',
            x: ''
        }
    },

    /* ------------------------------------------------------------------
     * Badges affichés dans le bandeau d'accueil (arguments de confiance)
     * ------------------------------------------------------------------ */
    badges: [
        'Sécurité au travail',
        'Contrôle qualité',
        'Matériaux de qualité supérieure',
        'Fabrication sur mesure'
    ],

    /* ------------------------------------------------------------------
     * Chiffres clés.
     * ⚠️ À COMPLÉTER avec vos chiffres réels : tant que cette liste est
     * vide, la section n'est pas affichée (aucune donnée inventée).
     *
     * Exemple :
     *   { value: '15+',  label: "Années d'expérience" },
     *   { value: '500+', label: 'Clients accompagnés' },
     *   { value: '3 000 m²', label: "Surface de l'atelier" },
     *   { value: '100%', label: 'Engagement qualité' }
     * ------------------------------------------------------------------ */
    stats: [],

    /* ------------------------------------------------------------------
     * Arguments « Pourquoi nous choisir » (liste de coches)
     * ------------------------------------------------------------------ */
    features: [
        'Fabrication sur mesure',
        'Respect des délais',
        'Accompagnement technique',
        'Devis gratuit et sans engagement'
    ],

    /* ------------------------------------------------------------------
     * Cartes « Pourquoi nous choisir »
     * ------------------------------------------------------------------ */
    whyUs: [
        {
            title: 'Savoir-faire technique',
            text: "Soudeurs et techniciens qualifiés, maîtrisant soudure, découpe, pliage et assemblage de structures métalliques."
        },
        {
            title: 'Contrôle qualité',
            text: "Vérification de chaque fabrication à toutes les étapes, du choix des matériaux à la livraison."
        },
        {
            title: 'Solutions sur mesure',
            text: "Chaque projet est conçu selon vos plans, vos contraintes de production et votre environnement industriel."
        },
        {
            title: 'Sécurité et fiabilité',
            text: "Des installations et des fabrications conçues pour durer, dans le respect des règles de sécurité."
        }
    ],

    /* ------------------------------------------------------------------
     * Prestations (regroupées par métier)
     * ------------------------------------------------------------------ */
    serviceGroups: [
        {
            title: 'Chaudronnerie industrielle',
            summary: "Conception et fabrication de structures métalliques robustes pour l'industrie et le bâtiment.",
            points: [
                'Cuves, citernes et réservoirs',
                'Charpentes et ossatures métalliques',
                'Chemins de câbles et supports',
                'Structures et châssis sur mesure'
            ]
        },
        {
            title: 'Construction mécanique',
            summary: 'Réalisation de machines, équipements et ensembles mécaniques adaptés à vos besoins.',
            points: [
                'Machines et équipements sur mesure',
                'Châssis pour véhicules et engins',
                'Pièces mécaniques usinées',
                'Montage et mise en service'
            ]
        },
        {
            title: 'Soudure, découpe et pliage',
            summary: 'Mise en œuvre des techniques de soudage et de formage du métal avec précision.',
            points: [
                'Soudure MIG, TIG et ARC',
                'Découpe de tôles et profilés',
                'Pliage et formage',
                'Assemblage et ajustage'
            ]
        },
        {
            title: 'Maintenance industrielle',
            summary: 'Interventions préventives et correctives pour limiter les arrêts de production.',
            points: [
                'Maintenance préventive planifiée',
                'Dépannage et réparation',
                'Remise en état des équipements',
                'Interventions sur site'
            ]
        }
    ],

    /* ------------------------------------------------------------------
     * Témoignages clients.
     * ⚠️ N'affichez que de vrais témoignages (nom + fonction autorisés).
     * Tant que la liste est vide, la section n'apparaît pas.
     *
     * Exemple :
     *   { quote: '...', name: 'Prénom Nom', role: 'Directeur, Société' }
     * ------------------------------------------------------------------ */
    testimonials: []
};
