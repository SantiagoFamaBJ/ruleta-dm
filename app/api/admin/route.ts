import { createHash, timingSafeEqual } from 'node:crypto';
import { normalizeConfig } from '../../../lib/config';
import { COLUMNS, db, loadConfig, saveConfig, TABLE, type ParticipantRow } from '../../../lib/db';
import { buildEmblueCsv, buildXlsx } from '../../../lib/export';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

function checkPassword(given: unknown): 'ok' | 'bad' | 'unset' {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return 'unset';
  if (typeof given !== 'string') return 'bad';
  const a = createHash('sha256').update(given).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b) ? 'ok' : 'bad';
}

/** Trae todas las filas (Supabase devuelve como máximo 1000 por consulta) */
async function fetchAll(): Promise<ParticipantRow[]> {
  const rows: ParticipantRow[] = [];
  const size = 1000;
  for (let from = 0; ; from += size) {
    const { data, error } = await db()
      .from(TABLE)
      .select(COLUMNS)
      .order('created_at', { ascending: false })
      .range(from, from + size - 1);
    if (error) throw error;
    const page = (data ?? []) as unknown as ParticipantRow[];
    rows.push(...page);
    if (page.length < size) break;
  }
  return rows;
}

/**
 * POST /api/admin  { password, action: 'list' | 'delete' | 'xlsx' | 'csv', id?, delimiter? }
 * La clave se compara en el servidor contra la variable de entorno ADMIN_PASSWORD.
 */
export async function POST(req: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'Solicitud inválida.' }, 400);
  }
  if (!body || typeof body !== 'object') return json({ error: 'Solicitud inválida.' }, 400);

  const auth = checkPassword(body.password);
  if (auth === 'unset') return json({ error: 'Falta configurar ADMIN_PASSWORD en las variables de entorno.' }, 500);
  if (auth === 'bad') {
    await new Promise((resolve) => setTimeout(resolve, 600)); // frena intentos a lo loco
    return json({ error: 'Clave incorrecta.' }, 401);
  }

  try {
    switch (body.action) {
      case 'list':
        return json({ rows: await fetchAll() });

      case 'delete': {
        const id = typeof body.id === 'string' ? body.id : '';
        if (!UUID_RE.test(id)) return json({ error: 'Solicitud inválida.' }, 400);
        const { error } = await db().from(TABLE).delete().eq('id', id);
        if (error) throw error;
        return json({ ok: true });
      }

      case 'deliver': {
        const id = typeof body.id === 'string' ? body.id : '';
        if (!UUID_RE.test(id) || typeof body.value !== 'boolean') return json({ error: 'Solicitud inválida.' }, 400);
        const at = body.value ? new Date().toISOString() : null;
        const { error } = await db().from(TABLE).update({ entregado: body.value, entregado_at: at }).eq('id', id);
        if (error) throw error;
        return json({ ok: true, entregado_at: at });
      }

      case 'getConfig':
        return json({ config: await loadConfig() });

      case 'saveConfig': {
        const config = normalizeConfig(body.config);
        await saveConfig(config);
        return json({ config });
      }

      case 'xlsx': {
        const file = await buildXlsx(await fetchAll());
        return new Response(new Uint8Array(file), {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="ruleta-dental-medrano.xlsx"',
            'Cache-Control': 'no-store',
          },
        });
      }

      case 'csv': {
        const delimiter = body.delimiter === ',' ? ',' : ';';
        const csv = buildEmblueCsv(await fetchAll(), delimiter);
        return new Response(csv, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attachment; filename="ruleta-dental-medrano-emblue.csv"',
            'Cache-Control': 'no-store',
          },
        });
      }

      default:
        return json({ error: 'Acción inválida.' }, 400);
    }
  } catch (err) {
    console.error('[ruleta] /api/admin', err);
    if (err instanceof Error && err.message === 'CONFIG_SUPABASE') {
      return json({ error: 'Falta configurar la conexión con Supabase (revisá las variables de entorno).' }, 500);
    }
    return json({ error: 'Algo salió mal. Probá de nuevo.' }, 500);
  }
}
