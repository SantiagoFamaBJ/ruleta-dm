-- Ruleta Dental Medrano
-- Crea UNA tabla nueva. No toca ninguna tabla existente.

create table if not exists public.ruleta_participantes (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  nombre       text not null,
  apellido     text not null,
  celular      text not null,
  celular_norm text not null,            -- últimos 10 dígitos, para detectar repetidos
  email        text not null,
  ocupacion    text not null,
  especialidad text,
  premio_tipo  text not null,            -- coltene | densell | seguir | descuento
  premio       text not null,
  gajo         smallint not null,        -- 1 a 12
  acepto       boolean not null default true,
  token        uuid not null,            -- evita sortear dos veces si se reintenta el mismo giro
  constraint ruleta_participantes_email_key unique (email),
  constraint ruleta_participantes_celular_norm_key unique (celular_norm),
  constraint ruleta_participantes_token_key unique (token)
);

create index if not exists ruleta_participantes_created_idx
  on public.ruleta_participantes (created_at desc);

-- Solo el servidor (clave service_role) puede leer y escribir:
-- RLS activado y sin policies, así el navegador no puede tocar la tabla.
alter table public.ruleta_participantes enable row level security;
