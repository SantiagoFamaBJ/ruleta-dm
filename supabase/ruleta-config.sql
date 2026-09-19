-- Ruleta Dental Medrano: textos y premios editables desde /admin
-- Crea UNA tabla nueva. No toca ninguna tabla existente.

create table if not exists public.ruleta_config (
  id         text primary key,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

-- Solo el servidor (service_role) puede leer y escribir
alter table public.ruleta_config enable row level security;
