-- Ruleta Dental Medrano: marcar premios como entregados
-- Agrega 2 columnas a la tabla de la ruleta. No borra ni cambia datos existentes.

alter table public.ruleta_participantes
  add column if not exists entregado boolean not null default false,
  add column if not exists entregado_at timestamptz;
