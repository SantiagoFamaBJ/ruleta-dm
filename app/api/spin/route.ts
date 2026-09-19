import { randomInt } from 'node:crypto';
import { SLICES } from '../../../lib/config';
import { db, loadConfig, TABLE } from '../../../lib/db';
import { validateParticipant } from '../../../lib/validation';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

function resultOf(index: number, type: string, prize: string) {
  return { index, type, prize };
}

function duplicate(field: 'email' | 'celular') {
  return {
    field,
    error: field === 'email' ? 'Este mail ya participó de la ruleta.' : 'Este celular ya participó de la ruleta.',
  };
}

/**
 * POST /api/spin
 *  - con `checkOnly: true` solo verifica que el mail y el celular no hayan participado.
 *  - sin `checkOnly` sortea el premio, lo guarda junto con los datos y devuelve el gajo ganador.
 *
 * El sorteo se decide acá, en el servidor, con un random criptográfico: cada uno de los
 * gajos tiene exactamente la misma chance. El navegador solo anima la ruleta hasta ese gajo.
 */
export async function POST(req: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'Solicitud inválida.' }, 400);
  }
  if (!body || typeof body !== 'object') return json({ error: 'Solicitud inválida.' }, 400);

  const parsed = validateParticipant(body);
  if (!parsed.ok) return json({ error: 'Revisá los datos ingresados.', errors: parsed.errors }, 400);
  const p = parsed.data;

  const checkOnly = body.checkOnly === true;
  const token = typeof body.token === 'string' ? body.token : '';
  if (!checkOnly && !UUID_RE.test(token)) return json({ error: 'Solicitud inválida.' }, 400);

  try {
    const supabase = db();

    // Reintento del mismo giro (por ejemplo, se cortó internet justo al responder):
    // se devuelve el mismo resultado en vez de sortear de nuevo.
    if (!checkOnly) {
      const { data: prev, error } = await supabase.from(TABLE).select('gajo, premio, premio_tipo').eq('token', token).maybeSingle();
      if (error) throw error;
      if (prev) return json(resultOf(prev.gajo - 1, prev.premio_tipo, prev.premio));
    }

    // ¿Ya participó con este mail o este celular?
    const [byMail, byPhone] = await Promise.all([
      supabase.from(TABLE).select('id').eq('email', p.email).limit(1),
      supabase.from(TABLE).select('id').eq('celular_norm', p.celularNorm).limit(1),
    ]);
    if (byMail.error) throw byMail.error;
    if (byPhone.error) throw byPhone.error;
    if (byMail.data?.length) return json(duplicate('email'), 409);
    if (byPhone.data?.length) return json(duplicate('celular'), 409);

    if (checkOnly) return json({ ok: true });

    const index = randomInt(SLICES.length);
    const slice = SLICES[index];

    // "Intentá de nuevo": no se guarda nada y la persona vuelve a girar (el mail y el celular siguen libres)
    if (slice.type === 'reintentar') return json(resultOf(index, slice.type, ''));

    const prize = (await loadConfig()).prizes[slice.id]; // nombre del premio cargado en /admin

    const { error: insertError } = await supabase.from(TABLE).insert({
      nombre: p.nombre,
      apellido: p.apellido,
      celular: p.celular,
      celular_norm: p.celularNorm,
      email: p.email,
      ocupacion: p.ocupacion,
      especialidad: p.especialidad,
      premio_tipo: slice.type,
      premio: prize,
      gajo: index + 1,
      acepto: true,
      token,
    });

    if (insertError) {
      // 23505 = valor repetido. Puede ser el mismo giro reintentado o alguien que participó justo en paralelo.
      if (insertError.code === '23505') {
        const { data: again } = await supabase.from(TABLE).select('gajo, premio, premio_tipo').eq('token', token).maybeSingle();
        if (again) return json(resultOf(again.gajo - 1, again.premio_tipo, again.premio));
        return json(duplicate(/celular/.test(insertError.message) ? 'celular' : 'email'), 409);
      }
      throw insertError;
    }

    return json(resultOf(index, slice.type, prize));
  } catch (err) {
    console.error('[ruleta] /api/spin', err);
    if (err instanceof Error && err.message === 'CONFIG_SUPABASE') {
      return json({ error: 'Falta configurar la conexión con Supabase (revisá las variables de entorno).' }, 500);
    }
    return json({ error: 'No se pudo registrar tu participación. Probá de nuevo.' }, 500);
  }
}
