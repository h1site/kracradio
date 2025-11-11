# KracRadio 🎙️

Plateforme web moderne pour la diffusion de podcasts et contenu audio avec gestion de communauté d'artistes.

## 🚀 Fonctionnalités

### Pour les utilisateurs
- 🎧 Écoute de podcasts et épisodes
- 📝 Lecture d'articles et blogs
- 👥 Découverte de profils d'artistes
- 🔍 Recherche et filtrage de contenu
- 🌐 Support multilingue (FR/EN/ES)

### Pour les créateurs
- 🎨 Profil artistique personnalisable
- 📡 Import automatique de flux RSS
- ✍️ Éditeur d'articles avec formatage riche (TipTap)
- 🖼️ Gestion d'images et médias

### Panel d'administration
- 👥 Gestion des utilisateurs et rôles
- 📡 Gestion des podcasts RSS (import, édition, suppression)
- 📝 Gestion des articles (publication, brouillon)
- 🎨 Gestion des artistes (vérification, visibilité)
- 📊 Vue d'ensemble complète du site

## 🛠️ Stack Technique

- **Frontend**: React 18.3 avec React Router
- **Styling**: TailwindCSS 3.4
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Éditeur**: TipTap (éditeur WYSIWYG)
- **Build**: React Scripts (CRA)

## 📦 Installation

```bash
# Cloner le dépôt
git clone https://github.com/h1site/kracradio.git
cd kracradio

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos credentials Supabase

# Lancer en développement
npm start
```

## 🔐 Configuration Supabase

1. Créer un projet sur [Supabase](https://supabase.com)
2. Configurer les variables dans `.env.local` :
   ```
   REACT_APP_SUPABASE_URL=votre_url
   REACT_APP_SUPABASE_ANON_KEY=votre_key
   ```
3. Appliquer les migrations :
   ```bash
   supabase db push
   ```

## 🗃️ Structure de la base de données

### Tables principales
- `profiles` - Profils utilisateurs et artistes
- `user_podcasts` - Podcasts et flux RSS
- `podcast_episodes` - Épisodes de podcasts
- `articles` - Articles et blogs

### Colonnes importantes
- `profiles.role` - Rôles : 'user', 'creator', 'admin'
- `profiles.artist_slug` - Identifiant unique artiste
- `profiles.is_verified` - Statut vérifié
- `profiles.is_public` - Visibilité du profil

## 📝 Scripts

```bash
# Développement
npm start

# Build de production
npm run build

# Tests
npm test
```

## 🎨 Panneau Admin

Accessible à `/admin` pour les utilisateurs avec `role = 'admin'`.

Pour promouvoir un utilisateur en admin :
```sql
UPDATE profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'votre@email.com');
```

## 🌍 Déploiement

Le projet est optimisé pour le déploiement sur :
- Vercel
- Netlify
- Render
- Tout service supportant Node.js 22.x

## 📄 Licence

Propriétaire - Tous droits réservés

## 👨‍💻 Développement

Pour contribuer au projet, assurez-vous de :
1. Créer une branche depuis `main`
2. Tester vos modifications localement
3. Créer une pull request avec description détaillée

---

Développé avec ❤️ par l'équipe KracRadio
