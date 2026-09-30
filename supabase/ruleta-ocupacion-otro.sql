-- Ruleta Dental Medrano: detalle de ocupación cuando eligen "Otro"
-- Agrega 1 columna a la tabla de la ruleta. No borra ni cambia datos existentes.

alter table public.ruleta_participantes
  add column if not exists ocupacion_otro text;
