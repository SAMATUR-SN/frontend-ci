# Sama Tur — frontend

Interface web de suivi des dossiers d'état civil des élèves (détection, certificat, jugement supplétif, transcription, remise de l'acte). Application Angular 22 (composants autonomes, sans zone, signaux) qui parle à l'API Spring Boot du dépôt `backend-ci`. L'application se trouve dans le dossier [`sama-tur/`](sama-tur/).

## Prérequis

- **Node.js** `^22.22.3`, `^24.15.0` ou `>=26` : c'est la condition d'Angular CLI 22.2. Avec une version plus ancienne, `npm ci` ou `ng` refusent de démarrer.
- **npm 11** (le champ `packageManager` du projet indique 11.20.0).
- **Docker** et Docker Compose, pour lancer le backend et pour construire l'image du frontend.
- Le dépôt **`backend-ci`**, cloné à côté de celui-ci.

## Lancer en développement

**1. Le backend**, depuis le dépôt `backend-ci` :

```bash
cp .env.example .env        # puis renseigner SPRING_DATASOURCE_PASSWORD et SAMATUR_JWT_SECRET (32 caractères au moins)
docker compose -f compose.dev.yaml up -d
curl http://localhost:8080/health      # {"status":"UP"} quand l'API est prête (le premier démarrage prend quelques minutes)
```

La base démarre avec 40 élèves fictifs de Bambey. Le détail des variables est dans le README du backend.

**2. Le frontend**, depuis ce dépôt :

```bash
cd sama-tur
npm ci
npm start                   # http://localhost:4200
```

Le frontend n'appelle que des chemins relatifs `/api/...`. En développement, le proxy de [`sama-tur/proxy.conf.json`](sama-tur/proxy.conf.json) les envoie vers `http://localhost:8080` : même origine, donc pas de CORS à configurer. Ce proxy ne sert qu'à `ng serve`.

## Tests

```bash
cd sama-tur
npm test                              # mode interactif
npx ng test --watch=false             # une seule passe, pour la CI
```

Vitest, dans jsdom. Les tests couvrent les étapes et les rôles, les requêtes d'avancement, l'intercepteur et les gardes, les services HTTP, le contrôle du fichier CSV avant envoi et les écrans.

## Build

```bash
cd sama-tur
npm run build               # production ; fichiers statiques dans sama-tur/dist/sama-tur/browser/
```

L'application est une **application monopage statique** (pas de rendu côté serveur) : `index.html`, `main-*.js`, `styles-*.css` et les écrans chargés à la demande. Le build ne doit produire **aucun avertissement**. Budgets : 500 kB pour le bundle initial, 6 kB (avertissement) et 8 kB (erreur) par feuille de style de composant. Les écrans les plus lourds (fiche d'un dossier, alertes, import CSV) sont chargés à la demande.

## Image Docker

```bash
docker build -t samatur-frontend:dev sama-tur
docker run --rm -d --name samatur-front-test -p 8081:8080 samatur-frontend:dev
curl -i http://localhost:8081/health        # 200 « ok »
curl -i http://localhost:8081/dashboard     # 200, index.html (repli de l'application monopage)
docker rm -f samatur-front-test
```

L'image sert les fichiers statiques avec **nginx sans privilèges** (utilisateur non root) sur le **port 8080** du conteneur ; la configuration est dans [`sama-tur/nginx.conf`](sama-tur/nginx.conf).

- **`GET /health`** (texte brut) : `200 ok` ; `503 draining` si le fichier `/tmp/draining` existe dans le conteneur. C'est ce que le déploiement sans coupure crée avant d'arrêter l'ancien conteneur pour que Traefik le retire du routage. Le `HEALTHCHECK` de l'image interroge cette route.
- **Aucune route `/api` dans l'image** : en production, Traefik envoie `/api` au backend, sur la même origine que le frontend. Le proxy de `proxy.conf.json` ne sert qu'à `ng serve`.
- `index.html` n'est jamais mis en cache ; les fichiers dont le nom porte un hachage se gardent un an.
- En-têtes : `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy: same-origin`. Il n'y a **pas de `Content-Security-Policy`** : sans essai dans un navigateur, elle risquerait de bloquer l'application.

## Structure

```
sama-tur/src/app/
├── core/                    ce qui sert à toute l'application
│   ├── models/              types de l'API (dossier, indicateurs, page, problème, rapport d'import…)
│   ├── services/            appels HTTP (auth, dossiers, alertes, indicateurs, référentiels, élèves) et session
│   ├── guards/              authGuard (connexion) et roleGuard (rôle de la route)
│   ├── interceptors/        jeton Bearer sur /api/, déconnexion sur 401
│   ├── utils/               règles pures : étapes, rôles, accès, dates, avancement, CSV, messages d'erreur
│   └── testing/             outils partagés par les tests
├── features/                un dossier par écran
│   ├── auth/login
│   ├── dashboard/           tableau de bord des indicateurs
│   ├── dossiers/            liste, fiche, frise des étapes, panneau « Avancer »
│   ├── alertes/             dossiers en retard
│   └── eleves/              import CSV et son résultat
├── app.routes.ts            routes et rôles autorisés
└── app.config.ts            intercepteur, locale française
```

## Écrans par rôle

| Écran | Route | École | État civil | Tribunal | Superviseur |
| --- | --- | :-: | :-: | :-: | :-: |
| Connexion | `/login` | oui | oui | oui | oui |
| Tableau de bord | `/dashboard` | oui | oui | oui | oui |
| Liste des dossiers | `/dossiers` | oui | oui | oui | oui |
| Fiche d'un dossier (lecture, historique) | `/dossiers/:id` | oui | oui | oui | oui |
| Faire avancer un dossier | `/dossiers/:id` | vers `DOSSIER_COMPLET` et `ACTE_REMIS` | vers `CERTIFICAT_OBTENU` et `TRANSCRIT` | vers `JUGEMENT_RENDU` | jamais |
| Alertes (dossiers en retard) | `/alertes` | non | oui, avec le bouton « Vérifier » | oui | oui |
| Import CSV | `/eleves/import` | oui | non | non | non |

Le rôle vient toujours du jeton, jamais d'une valeur envoyée par le frontend. L'interface masque ce qu'un rôle n'a pas à faire, mais **c'est le backend qui refuse** (403) : par exemple, un appel forcé pour faire avancer un dossier avec le mauvais rôle est rejeté par l'API.

## Se connecter (recette)

Quatre comptes de démonstration existent :

| Identifiant | Rôle |
| --- | --- |
| `ecole1@samatur.sn` | École |
| `etatcivil1@samatur.sn` | État civil |
| `tribunal1@samatur.sn` | Tribunal |
| `superviseur@samatur.sn` | Superviseur |

Les mots de passe sont **communiqués hors du dépôt**. Ouvrir <http://localhost:4200>, saisir l'identifiant et le mot de passe. Le jeton vaut 8 heures et est conservé dans le `sessionStorage` : fermer l'onglet déconnecte, et un nouvel onglet demande de se reconnecter. Un jeton expiré ou refusé ramène à la connexion avec « session expirée ».

## Fichier CSV d'exemple

Le fichier d'exemple est versionné dans le dépôt backend : `backend-ci/src/test/resources/import-exemple.csv` (une élève valide et une ligne volontairement fausse : à l'import, 1 importé et 1 rejeté ; au réimport, 0 importé et 2 rejetés). Se connecter en **École**, ouvrir « Importer des élèves », choisir le fichier.

L'écran propose aussi **« Télécharger le modèle CSV »** : l'en-tête exact des 13 colonnes et une ligne d'exemple, à supprimer avant l'envoi (l'écran la refuse tant qu'elle y est). Règles contrôlées avant l'envoi, comme le fait le serveur : extension `.csv`, UTF-8, séparateur `;`, 2 Mo au plus, 1 000 lignes de données au plus, colonnes `prenom`, `nom`, `sexe`, `date_naissance`, `commune_naissance`, `code_ecole`, `classe` et `nom_mere`.

## Limites connues

- **Jeton dans le `sessionStorage`.** Tout script exécuté dans la page peut le lire (risque XSS). C'est un choix de démonstration, à justifier dans le rapport. Le code n'emploie ni `innerHTML` ni contournement de l'assainissement d'Angular. Un cookie `HttpOnly` demanderait de modifier le backend.
- **Pas de résolution des alertes.** L'API liste les dossiers en retard et ne donne aucun identifiant d'alerte : `PATCH /api/alertes/{id}/resoudre` n'est pas atteignable depuis l'interface. Une alerte disparaît quand le dossier avance.
- **Pas de périmètre par structure.** Le backend ne filtre pas les dossiers par école, centre ou tribunal : tout rôle voit tous les dossiers.
- **L'accès à `/alertes` est une commodité d'interface.** Le backend laisse `GET /api/alertes` ouvert à tout compte connecté.
- **Pas de gestion élève par élève.** L'interface n'offre que l'import CSV : créer, modifier ou archiver un seul élève (`GET`, `POST`, `PUT` et `DELETE /api/eleves`, facultatifs dans le contrat, réservés à l'école) n'est pas réalisé. Les anciens écrans `/eleves`, `/eleves/nouveau` et `/eleves/:id`, qui n'étaient pas alignés sur l'API, ont été retirés.
- **Pas de test dans un navigateur.** Les écrans sont vérifiés par les tests et par des appels réels à l'API ; le rendu visuel reste à contrôler à l'œil.
