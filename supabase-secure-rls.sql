-- ============================================================
-- MILCOLOR — Sécurisation RLS (à coller dans SQL Editor Supabase)
-- Prérequis : avoir créé les 2 comptes Auth (voir SETUP-SECURITE.md)
-- ============================================================

-- Rôle lu depuis app_metadata.role (admin | animateur)
create or replace function public.milcolor_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() -> 'user_metadata' ->> 'role',
    ''
  );
$$;

create or replace function public.is_milcolor_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.milcolor_role() = 'admin';
$$;

revoke all on function public.milcolor_role() from public;
revoke all on function public.is_milcolor_admin() from public;
grant execute on function public.milcolor_role() to authenticated;
grant execute on function public.is_milcolor_admin() to authenticated;

-- Tables métier connues (ignore silencieusement si absente)
do $$
declare
  t text;
  pol record;
  tables text[] := array[
    'activites',
    'plannings',
    'remarques',
    'documents',
    'infos_enfants',
    'effectifs',
    'effectifs_prevus',
    'notifications',
    'bilans',
    'evaluations_bafa',
    'contacts_urgence',
    'materiel',
    'grands_jeux',
    'objectifs_fichiers',
    'liens_utiles',
    'animations_rapides',
    'impressions',
    'infos_jour',
    'sorties',
    'infos_sorties',
    'mercredi_suivi',
    'mercredi_animateurs',
    'mercredi_planning',
    'mercredi_seances',
    'mercredi_propositions',
    'mercredi_deja_fait'
  ];
begin
  foreach t in array tables
  loop
    if to_regclass('public.' || t) is null then
      raise notice 'skip missing relation: %', t;
      continue;
    end if;

    -- Tables only (skip views like mercredi_suivi)
    if not exists (
      select 1 from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = t and c.relkind = 'r'
    ) then
      raise notice 'skip non-table relation: %', t;
      continue;
    end if;

    execute format('alter table public.%I enable row level security', t);

    for pol in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy if exists %I on public.%I', pol.policyname, t);
    end loop;

    -- Anon : aucun accès. Authenticated : CRUD (comme l’app aujourd’hui).
    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      t || '_select_auth', t
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (true)',
      t || '_insert_auth', t
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (true) with check (true)',
      t || '_update_auth', t
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (true)',
      t || '_delete_auth', t
    );

    execute format('revoke all on table public.%I from anon', t);
    execute format(
      'grant select, insert, update, delete on table public.%I to authenticated',
      t
    );
  end loop;
end $$;

-- Realtime : les clients doivent être authentifiés (session JWT)
-- (rien à faire ici si Realtime est déjà activé sur les tables)

-- Vues mercredis : retirer l’accès anon (RLS vient des tables sous-jacentes)
do $$
declare
  v text;
  views text[] := array[
    'mercredi_suivi',
    'mercredi_planning',
    'mercredi_deja_fait'
  ];
begin
  foreach v in array views
  loop
    if to_regclass('public.' || v) is null then
      continue;
    end if;
    execute format('revoke all on table public.%I from anon', v);
    execute format('grant select on table public.%I to authenticated', v);
  end loop;
end $$;

-- Storage : à configurer dans le Dashboard (Storage → Policies) si besoin.
-- Le rôle migration n’est pas owner de storage.objects sur les projets hébergés.

notify pgrst, 'reload schema';
