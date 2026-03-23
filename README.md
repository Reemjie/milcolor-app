# 🎨 Milcolor App

Application mobile pour les animateurs du centre de loisirs Milcolor.

## Pages

- **📅 Plannings** — Publication et consultation des plannings hebdomadaires
- **🎨 Activités** — Fiches d'activités avec photos
- **💬 Remarques** — Notes de journée et bilans
- **📁 Documents** — Projet pédagogique, attentes du directeur, infos pratiques

---

## 🚀 Installation en 5 étapes

### Étape 1 — Créer le repo GitHub

1. Va sur [github.com](https://github.com) → **New repository**
2. Nom : `milcolor-app`
3. Visibilité : **Public** (requis pour GitHub Pages gratuit)
4. Clique **Create repository**

### Étape 2 — Configurer Supabase

1. Va sur [supabase.com](https://supabase.com) → ton projet
2. Menu gauche → **SQL Editor**
3. Colle tout le contenu de `supabase-setup.sql` et clique **Run**
4. Récupère tes clés : **Settings → API**
   - `Project URL` → c'est ton `SUPABASE_URL`
   - `anon public` → c'est ton `SUPABASE_ANON_KEY`

### Étape 3 — Configurer les secrets GitHub

Dans ton repo GitHub → **Settings → Secrets and variables → Actions → New repository secret**

Ajoute ces 4 secrets :

| Nom | Valeur |
|-----|--------|
| `VITE_SUPABASE_URL` | L'URL de ton projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | La clé anon de Supabase |
| `VITE_ANIM_PASSWORD` | Le mot de passe des animateurs (ex: `milcolor2026`) |
| `VITE_ADMIN_PASSWORD` | Ton mot de passe directeur (ex: `directeur2026`) |

### Étape 4 — Pusher le code

Dans un terminal, depuis le dossier `milcolor-app` :

```bash
git init
git add .
git commit -m "🎨 Initial commit — Milcolor App"
git branch -M main
git remote add origin https://github.com/TON_USERNAME/milcolor-app.git
git push -u origin main
```

### Étape 5 — Activer GitHub Pages

1. Dans ton repo → **Settings → Pages**
2. Source : **Deploy from a branch**
3. Branch : **gh-pages** → **/ (root)**
4. Clique **Save**

⏳ Attends 2-3 minutes, puis ton app est disponible sur :
**https://TON_USERNAME.github.io/milcolor-app/**

---

## 📱 Ajouter l'app sur le téléphone

### iPhone
1. Ouvre le lien dans **Safari**
2. Icône de partage → **"Sur l'écran d'accueil"**

### Android
1. Ouvre le lien dans **Chrome**
2. Menu (⋮) → **"Ajouter à l'écran d'accueil"**

---

## 🔑 Mots de passe

- **Animateurs** : le mot de passe défini dans `VITE_ANIM_PASSWORD`
- **Directeur** : le mot de passe défini dans `VITE_ADMIN_PASSWORD`

Le directeur a accès à toutes les fonctions d'édition et suppression.

---

## 🔄 Modifier le contenu

Pour mettre à jour l'app après un changement de code :
```bash
git add .
git commit -m "mise à jour"
git push
```
Le déploiement se fait automatiquement en 2-3 minutes.
