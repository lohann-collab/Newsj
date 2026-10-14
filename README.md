# Francia Politique — backend Vercel, fichiers à plat

Tous les fichiers sont directement dans ce dossier. Il n’y a aucun sous-dossier.

## Fichiers
- `index.html`, `style.css`, `script.js` : site public et régie
- `state.js`, `login.js`, `reset.js` : fonctions backend Vercel
- `store.js` : accès au stockage Redis
- `package.json`, `vercel.json` : configuration Vercel
- `.env.example` : noms des variables à configurer
- `.gitignore` : fichiers à ne pas publier

## Déploiement
1. Envoyez tous les fichiers à la racine de votre dépôt GitHub.
2. Importez le dépôt dans Vercel.
3. Créez une base Redis REST sur Upstash et récupérez son URL REST et son token.
4. Dans Vercel → Settings → Environment Variables, ajoutez :
   - `ADMIN_PASSWORD` : mot de passe administrateur unique, 12 caractères minimum.
   - `ADMIN_TOKEN_SECRET` : secret aléatoire d'au moins 32 caractères.
   - `UPSTASH_REDIS_REST_URL` : URL fournie par Upstash.
   - `UPSTASH_REDIS_REST_TOKEN` : token fourni par Upstash.
5. Redéployez le projet.
6. Ouvrez le site, cliquez sur Régie et connectez-vous avec `ADMIN_PASSWORD`.

Vous pouvez générer un secret avec `openssl rand -hex 32`. Ne mettez jamais les vraies valeurs dans GitHub.

## Fonctionnement
Les résultats et annonces textuelles sont stockés côté serveur et rafraîchis chez les visiteurs environ toutes les 4 secondes. Le microphone n'est pas diffusé aux spectateurs dans cette version : une solution audio temps réel séparée serait nécessaire.

Les chiffres initiaux sont fictifs et doivent rester identifiés comme une simulation.
