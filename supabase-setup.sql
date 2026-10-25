-- ============================================================
-- MILCOLOR APP — Script SQL Supabase
-- Colle ce script dans l'éditeur SQL de ton projet Supabase
-- ============================================================

-- Table : activités
create table if not exists activites (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  animateur text not null,
  type text not null default 'Activité manuelle',
  age text not null default '3-5 ans',
  materiel text,
  regles text,
  commentaires text,
  photo_url text,
  created_at timestamptz default now()
);

-- Table : plannings
create table if not exists plannings (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  date_debut date,
  couleur text default '#FF6B35',
  slots jsonb default '{}',
  created_at timestamptz default now()
);

-- Table : remarques
create table if not exists remarques (
  id uuid primary key default gen_random_uuid(),
  auteur text not null,
  contenu text not null,
  categorie text default 'remarque',
  date_journee date,
  created_at timestamptz default now()
);

-- Table : documents (projet péda, attentes, infos)
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  section_id text not null unique,
  contenu text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- RLS : NE PAS utiliser d’accès public.
-- Après création des tables, exécute supabase-secure-rls.sql
-- (accès réservé aux utilisateurs Supabase Auth).
-- Voir SETUP-SECURITE.md
-- ============================================================
