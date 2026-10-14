# Francia Politique Live

Plateau public et régie administrateur séparée, avec scores, annonces et commentaires synchronisés par Supabase Realtime. Le micro admin est transmis aux spectateurs via WebRTC.

## 1. Pré-requis

- Node.js 20+
- Un projet Supabase
- HTTPS en production (requis par les navigateurs pour l'accès au microphone, sauf localhost)

## 2. Préparer Supabase

1. Créez un projet Supabase.
2. Ouvrez **SQL Editor** et exécutez tout le contenu de `supabase/schema.sql`.
3. Dans **Authentication → Users**, créez un utilisateur administrateur avec e-mail et mot de passe.
4. Copiez l'UUID de cet utilisateur.
5. Dans SQL Editor, exécutez cette requête en remplaçant l'UUID :

```sql
insert into public.fp_admins (user_id, enabled)
values ('UUID_DE_L_ADMIN', true)
on conflict (user_id) do update set enabled = true;
```

6. Dans les paramètres API du projet, copiez l'URL du projet et la clé **publishable** (ou la clé anon legacy). N'utilisez jamais la clé `service_role` dans le navigateur.

## 3. Lancer localement

```bash
cp .env.example .env.local
```

Remplacez les valeurs dans `.env.local`, puis :

```bash
npm install
npm run dev
```

Vite affiche une adresse locale. Plateau public : `/`. Régie admin : `/admin`.

## 4. Déployer sur Vercel

1. Importez ce dossier dans un dépôt GitHub.
2. Dans Vercel, importez le dépôt.
3. Framework : Vite ; build : `npm run build` ; output : `dist`.
4. Ajoutez les variables d'environnement `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (clé publishable/anon seulement).
5. Redéployez après l'ajout des variables.

Vercel sert automatiquement `/admin` avec `index.html` pour cette application Vite. Si votre projet a désactivé le fallback SPA, ajoutez une réécriture vers `/index.html`.

## 5. Audio live — limites importantes

Le microphone utilise WebRTC avec un serveur STUN public. Cela peut fonctionner sur de nombreux réseaux, mais certains réseaux mobiles, Wi-Fi d'entreprise ou NAT stricts exigent un serveur TURN. Pour une diffusion fiable à beaucoup de spectateurs, utilisez un fournisseur WebRTC/SFU (par exemple LiveKit ou un service équivalent) plutôt qu'une connexion peer-to-peer individuelle.

Le navigateur peut exiger une interaction de l'utilisateur pour démarrer la lecture audio. Le public doit autoriser la lecture audio si elle est bloquée. Gardez la régie ouverte pendant la diffusion.

## Sécurité

- L'accès admin est vérifié via Supabase Auth et la fonction SQL `fp_is_admin()`.
- Les visiteurs peuvent lire les résultats et envoyer des messages de chat.
- Seuls les admins autorisés peuvent modifier les résultats et publier des annonces.
- Ne mettez jamais `service_role` dans les variables `VITE_*` ni dans le code client.
- Les messages du chat sont ouverts au public dans ce prototype ; ajoutez une protection anti-spam / rate limit avant un lancement public.

## Données

Les pourcentages sont les valeurs saisies par la régie. Ils ne sont pas automatiquement normalisés. La page les étiquette comme simulation et non comme résultats officiels.
