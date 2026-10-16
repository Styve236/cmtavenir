# CMT AVENIR — Site web officiel

Site de l'entreprise **CMT AVENIR** (chaudronnerie industrielle, métallurgie et construction mécanique — Douala, Cameroun), avec un espace d'administration permettant de gérer les partenaires et de consulter les messages reçus.

- **Serveur** : Node.js 20 + Express + EJS (rendu côté serveur)
- **Données** : Firestore (base de données Firebase)
- **Hébergement** : Firebase Hosting + Cloud Functions (génération 2, région `europe-west1`)
- **Front** : HTML/CSS/JS natif (aucun framework), responsive et accessible

---

## 1. Prérequis

| Outil | Version |
|---|---|
| Node.js | 20 ou plus |
| npm | 10 ou plus |
| Compte Google | pour Firebase (plan **Blaze** requis pour les Cloud Functions) |
| Git | pour GitHub |

---

## 2. Installation en local

```bash
# 1. Dépendances (installe aussi celles du dossier functions/)
npm install

# 2. Fichier d'environnement
copy .env.example .env      # Windows
cp .env.example .env        # macOS / Linux

# 3. Lancer le serveur
npm start
```

Le site est disponible sur **http://localhost:3000**
L'administration sur **http://localhost:3000/admin**

> Sans configuration supplémentaire, le site démarre avec :
> - le mot de passe admin par défaut `CMT2025` (à changer, voir §4) ;
> - une base locale `functions/data/dev-db.json` (ignorée par git).

### Amorcer les partenaires de départ

```bash
npm run seed
```

### Autres commandes

| Commande | Effet |
|---|---|
| `npm start` | Serveur de développement |
| `npm run dev` | Idem avec redémarrage automatique (nodemon) |
| `npm run lint` | Vérifie la syntaxe de tous les fichiers JavaScript |
| `npm run seed` | Ajoute les partenaires de départ |
| `npm run images` | Optimise les photos (WebP + miniatures + icône iOS) |
| `npm run hash-password -- "MonMotDePasse"` | Génère le hash bcrypt du mot de passe admin |
| `npm run emulators` | Firebase Emulators (Hosting + Functions + Firestore) |
| `npm run deploy` | Déploie le site sur Firebase |

---

## 3. Structure du projet

```
cmt-avenir/
├── functions/                  Backend déployé en Cloud Function
│   ├── index.js                Point d'entrée Firebase (https.onRequest)
│   ├── app.js                  Application Express (sécurité, session, routes)
│   ├── routes/
│   │   ├── pages.js            Pages rendues en EJS
│   │   └── api.js              API REST
│   ├── lib/
│   │   ├── store.js            Firestore (ou fichier local en dev)
│   │   ├── content.js          Fusionne le contenu par défaut et les modifications admin
│   │   ├── images.js           Lit le manifeste des images optimisées (WebP/miniatures)
│   │   ├── mailer.js           Nodemailer (Gmail) + relais Formspree
│   │   └── validate.js         Validation des données envoyées
│   ├── middleware/auth.js      Session admin + protection CSRF simple
│   ├── data/site.js            Contenu éditable du site (coordonnées, prestations…)
│   ├── data/gallery.js         Contenu de la galerie (réalisations + catégories)
│   └── views/                  Gabarits EJS (partials/ header, footer…)
├── public/                     Fichiers statiques (servis par le CDN)
│   ├── css/style.css
│   ├── js/main.js              Menu, lightbox, animations, contact
│   ├── js/admin.js             Espace d'administration (partenaires, messages, contenu)
│   └── images/                 Photos, versions WebP, miniatures (thumbs/) et manifest.json
├── scripts/                    hash-password, seed-partners, optimize-images, check-syntax
├── server.js                   Serveur local (npm start)
├── firebase.json               Configuration Hosting + Functions
├── firestore.rules             Règles Firestore (accès serveur uniquement)
└── .env.example                Modèle des variables d'environnement
```

---

## 4. Mot de passe administrateur

1. Générez le hash de votre mot de passe :

   ```bash
   npm run hash-password -- "MonMotDePasseSolide"
   ```

2. Copiez la valeur `ADMIN_PASSWORD_HASH=...` dans `.env` (en local) ou
   créez le secret Firebase (en production, voir §6).

Le mot de passe n'est **jamais** présent en clair dans le code ni envoyé au navigateur : le serveur compare le hash avec `bcrypt`.

---

## 5. API

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/api/health` | public | État du service et type de stockage |
| GET | `/api/partners` | public | Liste des partenaires |
| POST | `/api/contact` | public | Envoi d'un message (limité à 8/heure) |
| POST | `/api/admin/login` | public | Connexion admin (10 tentatives/15 min) |
| POST | `/api/admin/logout` | admin | Déconnexion |
| GET | `/api/admin/session` | public | Session en cours ? |
| GET / POST | `/api/admin/partners` | admin | Lister / ajouter un partenaire |
| DELETE | `/api/admin/partners/:id` | admin | Supprimer un partenaire |
| GET | `/api/admin/messages` | admin | Messages reçus |
| DELETE | `/api/admin/messages/:id` | admin | Supprimer un message |

---

## 6. Mettre le projet sur GitHub

```bash
git init
git add .
git commit -m "Site CMT AVENIR (Node.js + Firebase)"
git branch -M main
git remote add origin https://github.com/VOTRE-COMPTE/cmt-avenir.git
git push -u origin main
```

> `.env` et `functions/data/dev-db.json` sont ignorés par git : aucun secret n'est publié.

---

## 7. Déployer sur Google (Firebase)

### 7.1 Créer le projet Firebase

1. Allez sur <https://console.firebase.google.com> → **Ajouter un projet** → nom : `cmt-avenir`.
2. Passez le projet au plan **Blaze** (nécessaire pour les Cloud Functions ; le quota gratuit reste très large).
3. Dans **Build → Firestore Database**, cliquez sur **Créer une base de données**, choisissez **Mode production** et la région `europe-west1`.

### 7.2 Relier le projet local

```bash
npm install -g firebase-tools
firebase login
firebase use cmt-avenir      # ou : firebase use --add
```

Vérifiez que l'identifiant du projet correspond bien dans `.firebaserc`.

### 7.3 Enregistrer les secrets

```bash
firebase functions:secrets:set SESSION_SECRET       # chaîne aléatoire longue
firebase functions:secrets:set ADMIN_PASSWORD_HASH  # hash bcrypt du § 4
firebase functions:secrets:set GMAIL_APP_PASSWORD   # mot de passe d'application Gmail
```

Variables non secrètes : créez `functions/.env` avec

```
GMAIL_USER=tefogangstevelandry@gmail.com
CONTACT_TO=tefogangstevelandry@gmail.com
FORMSPREE_ENDPOINT=https://formspree.io/f/xjknrnwk
```

### 7.4 Déployer

```bash
npm run deploy
```

Le site est en ligne sur `https://cmt-avenir.web.app` (et `https://cmt-avenir.firebaseapp.com`).

### 7.5 Amorcer les partenaires en production

```bash
firebase login:ci                    # pour un jeton si besoin
gcloud auth application-default login
npm run seed
```

### 7.6 Déploiement automatique (GitHub Actions)

Le workflow `.github/workflows/firebase-deploy.yml` redéploie à chaque `git push` sur `main`.

1. Console Firebase → ⚙️ **Paramètres du projet → Comptes de service → Générer une nouvelle clé privée**.
2. GitHub → dépôt → **Settings → Secrets and variables → Actions → New repository secret** :
   - nom : `FIREBASE_SERVICE_ACCOUNT`
   - valeur : le contenu JSON complet du fichier téléchargé.
3. Poussez sur `main` : le site est redéployé automatiquement.

### 7.7 Nom de domaine (optionnel)

Firebase Console → **Hosting → Ajouter un domaine personnalisé** (par exemple `cmtavenir.com`) puis suivez les instructions DNS.

---

## 8. Personnalisation

La plupart des textes « modifiables » sont regroupés dans **`functions/data/site.js`** :
coordonnées (téléphone, email, WhatsApp, adresse, horaires), réseaux sociaux,
badges de confiance, prestations (`serviceGroups`), arguments « Pourquoi nous choisir »
(`whyUs`) et témoignages (`testimonials`).

| Élément | Fichier |
|---|---|
| Adresse du site (SEO) | `functions/data/site.js` → `company.url` (à remplacer par votre domaine) |
| Coordonnées, réseaux sociaux, badges, prestations, « pourquoi nous choisir » | `functions/data/site.js` |
| Chiffres clés (bande de statistiques) | `functions/data/site.js` → `stats` ou via `/admin` (vide = section masquée) |
| Témoignages clients | `functions/data/site.js` → `testimonials` ou via `/admin` (vide = section masquée) |
| Prestations affichées | via `/admin` → « Contenu du site » |
| Photos de la galerie et catégories de filtre | `functions/data/gallery.js` + images dans `public/images/` |
| Textes des pages | `functions/views/*.ejs` (index, services, about, contact, legal, privacy…) |
| Couleurs et typographie | `public/css/style.css` (variables `:root`) |
| Partenaires | directement depuis `/admin` (aucun code à modifier) |

> Les sections « chiffres clés » et « témoignages » ne s'affichent que si les listes
> correspondantes contiennent des données : aucune valeur n'est inventée par défaut.

### Optimisation des images

Après avoir ajouté ou remplacé des photos dans `public/images/`, lancez :

```bash
npm run images
```

Le script génère les versions **WebP**, les **miniatures** (`public/images/thumbs/`),
l'icône iOS (`apple-touch-icon.png`) et le manifeste `public/images/manifest.json`
utilisé par les gabarits. Sans ce manifeste, le site continue d'utiliser les JPG
d'origine. Le script vérifie aussi que chaque image de la galerie existe bien
(attention à la casse, importante sous Linux/Firebase).

### SEO intégré

- `robots.txt` (`/robots.txt`) et `sitemap.xml` (`/sitemap.xml`) générés automatiquement.
- Balise `canonical`, Open Graph/Twitter absolus et données structurées JSON-LD (`LocalBusiness`).
- Un seul `<h1>` par page ; le nom de l'entreprise dans l'en-tête est un `<div class="brand">`.
- Fichiers CSS/JS versionnés automatiquement (cache-busting) pour éviter les versions obsolètes.

### Pages légales

Les pages `/mentions-legales` et `/confidentialite` sont fournies comme modèles.
Relisez et adaptez leur contenu (`functions/views/legal.ejs`, `privacy.ejs`) à votre
situation réelle avant la mise en ligne.

---

## 9. Sécurité

- Mot de passe admin haché (bcrypt) et jamais exposé au navigateur.
- Session signée dans un cookie `httpOnly` + `sameSite=lax` (8 h).
- Limitation du débit : connexion (10/15 min) et contact (8/heure).
- Validation et nettoyage de toutes les données reçues.
- En-têtes de sécurité via `helmet` (CSP limitant les sources de scripts).
- Vérification de l'origine des requêtes de modification (protection CSRF simple).
- Règles Firestore en lecture/écriture interdites depuis le navigateur : l'accès passe uniquement par le serveur.

---

## 10. Dépannage

| Problème | Solution |
|---|---|
| `npm start` échoue : port occupé | Changez `PORT` dans `.env` |
| Les partenaires n'apparaissent pas | Lancez `npm run seed` ou ajoutez-les via `/admin` |
| `firebase deploy` refuse les fonctions | Vérifiez que le projet est bien au plan **Blaze** |
| Aucun email reçu pour le contact | Renseignez `GMAIL_USER` + `GMAIL_APP_PASSWORD` (mot de passe d'application, pas le mot de passe Gmail) ou vérifiez `FORMSPREE_ENDPOINT` |
| Erreur Firestore « 5 NOT_FOUND » | La base Firestore n'est pas encore créée (§7.1) |

---

© CMT AVENIR — Douala, Cameroun.
