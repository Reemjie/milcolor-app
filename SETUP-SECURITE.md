# Sécurisation Milcolor — mise en service

L’app utilise maintenant **Supabase Auth** (plus de mot de passe dans le JS).  
Les animateurs tapent toujours **un seul mot de passe** ; les boutons d’entrée sans MDP ont été retirés.

## 1. Créer les 2 comptes dans Supabase

Dashboard → **Authentication** → **Users** → **Add user**

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| `animateur@milcolor.app` | *(celui des animateurs)* | animateur |
| `directeur@milcolor.app` | *(celui du directeur)* | admin |

Pour chaque user, ouvre le user → **Raw App Meta Data** et mets :

```json
{ "role": "animateur" }
```

ou

```json
{ "role": "admin" }
```

> Les emails ci-dessus sont des identifiants techniques (non utilisés pour envoyer des mails).  
> Tu peux les changer via les variables `VITE_ANIM_EMAIL` / `VITE_ADMIN_EMAIL`.

Désactive si besoin **Confirm email** (Auth → Providers → Email) pour ces comptes créés à la main.

## 2. Appliquer le SQL RLS

SQL Editor → colle tout le fichier `supabase-secure-rls.sql` → **Run**.

Ensuite, **sans être connecté**, l’API anon ne doit plus renvoyer les `infos_enfants` (HTTP 401 ou `[]` selon config).

## 3. Secrets GitHub Actions

Settings → Secrets → Actions :

| Secret | Valeur |
|--------|--------|
| `VITE_SUPABASE_URL` | URL projet |
| `VITE_SUPABASE_ANON_KEY` | clé **anon** (pas service_role) |
| `VITE_ANIM_EMAIL` | `animateur@milcolor.app` (optionnel) |
| `VITE_ADMIN_EMAIL` | `directeur@milcolor.app` (optionnel) |

**Supprime** les anciens secrets `VITE_ANIM_PASSWORD` et `VITE_ADMIN_PASSWORD` (ils ne doivent plus être dans le build).

## 4. Déployer

```bash
git push origin main
```

Attends le workflow Pages (2–3 min).

## 5. Vérifier

1. Ouvre l’app en navigation privée → login obligatoire.
2. Mot de passe animateur → Accueil OK, pas de badge Directeur.
3. Quitter → mot de passe directeur → badge ✦ Directeur.
4. Depuis un autre onglet **sans login**, l’URL API  
   `…/rest/v1/infos_enfants` avec seulement la clé anon → **refus**.

## Changer un mot de passe

Auth → Users → user → **Reset password** (ou Update user).  
Rien à rebuilder : le secret n’est plus dans le front.
