-- Structure rapide pour bilans (notes /10 + cases oui/non)
alter table public.bilans
  add column if not exists scores jsonb default '{}'::jsonb,
  add column if not exists checks jsonb default '{}'::jsonb;

comment on column public.bilans.scores is 'Notes /10: ambiance, activites, deroulement';
comment on column public.bilans.checks is 'Cases oui/non + commentaires: incident, materiel, surveiller, suggestion';
