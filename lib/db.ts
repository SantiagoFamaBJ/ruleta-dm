import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_CONFIG, normalizeConfig, type RuletaConfig } from './config';

/** Tabla nueva de este proyecto (prefijo ruleta_) */
export const TABLE = 'ruleta_participantes';

export interface ParticipantRow {
  id: string;
  created_at: string;
  nombre: string;
  apellido: string;
  celular: string;
  email: string;
  ocupacion: string;
  especialidad: string | null;
  premio_tipo: string;
  premio: string;
  gajo: number;
}

/** Columnas que se leen (no se trae el token ni el celular normalizado) */
export const COLUMNS =
  'id, created_at, nombre, apellido, celular, email, ocupacion, especialidad, premio_tipo, premio, gajo';

let client: SupabaseClient | null = null;

/**
 * Se usa solo desde el servidor (rutas /api). La clave service_role nunca
 * llega al navegador: no lleva el prefijo NEXT_PUBLIC_.
 */
export function db(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('CONFIG_SUPABASE');
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

/** Tabla con los textos y premios editables (una sola fila, id = 'main') */
export const CONFIG_TABLE = 'ruleta_config';

/** Si la tabla todavía no existe o falla algo, usa los valores por defecto (la ruleta sigue andando). */
export async function loadConfig(): Promise<RuletaConfig> {
  try {
    const { data, error } = await db().from(CONFIG_TABLE).select('data').eq('id', 'main').maybeSingle();
    if (error) throw error;
    return data ? normalizeConfig(data.data) : DEFAULT_CONFIG;
  } catch (err) {
    console.error('[ruleta] loadConfig', err);
    return DEFAULT_CONFIG;
  }
}

export async function saveConfig(config: RuletaConfig): Promise<void> {
  const { error } = await db()
    .from(CONFIG_TABLE)
    .upsert({ id: 'main', data: config, updated_at: new Date().toISOString() });
  if (error) throw error;
}
