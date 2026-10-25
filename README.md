# Milcolor App

Application mobile pour les animateurs du centre de loisirs Milcolor.

Authentification : **Supabase Auth** (mot de passe d’équipe).  
Les données ne sont plus accessibles avec la seule clé anon.

## Démarrage sécurisé

Suis **[SETUP-SECURITE.md](./SETUP-SECURITE.md)** dans l’ordre :

1. Créer les 2 users Auth + `app_metadata.role`
2. Exécuter `supabase-secure-rls.sql`
3. Configurer les secrets GitHub (URL + anon key + emails optionnels)
4. Push sur `main` → deploy Pages

## Dev local

```bash
cp .env.example .env
# renseigne VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

## Utilisation

- **Animateurs** : mot de passe équipe → Accueil, mercredis, etc.
- **Directeur** : mot de passe directeur → mêmes écrans + édition admin

Changer un mot de passe se fait dans Supabase Auth (pas de rebuild).

## Stack

React · Vite · React Router · Supabase (Auth + Postgres + Storage + Realtime) · GitHub Pages
