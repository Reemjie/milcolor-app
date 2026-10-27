-- Marquage « vu » par le directeur (visible aussi par les animateurs)
alter table public.bilans
  add column if not exists vu boolean not null default false,
  add column if not exists vu_at timestamptz;

comment on column public.bilans.vu is 'Bilan lu / vu par le directeur';
comment on column public.bilans.vu_at is 'Horodatage du marquage vu';
