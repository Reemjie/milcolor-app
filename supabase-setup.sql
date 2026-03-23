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
-- Politiques RLS (Row Level Security)
-- Accès public en lecture/écriture (protégé par mot de passe côté app)
-- ============================================================

alter table activites enable row level security;
alter table plannings enable row level security;
alter table remarques enable row level security;
alter table documents enable row level security;

-- Tout le monde peut lire
create policy "Lecture publique activites" on activites for select using (true);
create policy "Lecture publique plannings" on plannings for select using (true);
create policy "Lecture publique remarques" on remarques for select using (true);
create policy "Lecture publique documents" on documents for select using (true);

-- Tout le monde peut insérer (authentification gérée côté app)
create policy "Insertion publique activites" on activites for insert with check (true);
create policy "Insertion publique plannings" on plannings for insert with check (true);
create policy "Insertion publique remarques" on remarques for insert with check (true);
create policy "Insertion publique documents" on documents for insert with check (true);

-- Tout le monde peut modifier
create policy "Mise a jour activites" on activites for update using (true);
create policy "Mise a jour plannings" on plannings for update using (true);
create policy "Mise a jour remarques" on remarques for update using (true);
create policy "Mise a jour documents" on documents for update using (true);

-- Tout le monde peut supprimer
create policy "Suppression activites" on activites for delete using (true);
create policy "Suppression plannings" on plannings for delete using (true);
create policy "Suppression remarques" on remarques for delete using (true);
