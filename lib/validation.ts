import { ESPECIALIDADES, OCUPACIONES, OCUPACION_ODONTOLOGO } from './config';

export interface ParticipantInput {
  nombre: string;
  apellido: string;
  celular: string;
  email: string;
  ocupacion: string;
  especialidad: string;
  acepto: boolean;
}

export interface CleanParticipant {
  nombre: string;
  apellido: string;
  /** Solo números (con "+" adelante si lo escribió) */
  celular: string;
  /** Últimos 10 dígitos: sirve para detectar celulares repetidos */
  celularNorm: string;
  email: string;
  ocupacion: string;
  especialidad: string | null;
}

export type FieldName = keyof ParticipantInput;
export type FieldErrors = Partial<Record<FieldName, string>>;

export type ValidationResult =
  | { ok: true; data: CleanParticipant }
  | { ok: false; errors: FieldErrors };

const NAME_RE = /^\p{L}[\p{L}\p{M}'’ .-]*$/u;
// Tiene que arrancar con letra o número (evita que un mail se interprete como fórmula en Excel)
const EMAIL_RE = /^[A-Za-z0-9][^\s@]*@[^\s@]+\.[^\s@]{2,}$/;

const text = (v: unknown): string => (typeof v === 'string' ? v : '');

/** Si lo escribió todo en minúsculas o todo en mayúsculas, lo pasa a "Nombre Apellido" */
function tidyName(raw: string): string {
  const t = raw.trim().replace(/\s+/g, ' ');
  if (t !== t.toLowerCase() && t !== t.toUpperCase()) return t;
  return t
    .toLowerCase()
    .replace(/(^|[\s'’-])(\p{L})/gu, (_m, sep: string, ch: string) => sep + ch.toUpperCase());
}

export function cleanPhone(raw: string): { celular: string; celularNorm: string; digits: number } {
  const t = raw.trim();
  const digits = t.replace(/\D/g, '');
  return {
    celular: (t.startsWith('+') ? '+' : '') + digits,
    celularNorm: digits.slice(-10),
    digits: digits.length,
  };
}

export function validateParticipant(input: unknown): ValidationResult {
  const src = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const errors: FieldErrors = {};

  const nombre = tidyName(text(src.nombre));
  if (!nombre) errors.nombre = 'Ingresá tu nombre.';
  else if (nombre.length < 2 || nombre.length > 60 || !NAME_RE.test(nombre))
    errors.nombre = 'Revisá tu nombre: solo letras.';

  const apellido = tidyName(text(src.apellido));
  if (!apellido) errors.apellido = 'Ingresá tu apellido.';
  else if (apellido.length < 2 || apellido.length > 60 || !NAME_RE.test(apellido))
    errors.apellido = 'Revisá tu apellido: solo letras.';

  const phone = cleanPhone(text(src.celular));
  if (phone.digits < 8 || phone.digits > 15)
    errors.celular = 'Ingresá tu celular con código de área. Ej: 11 2345 6789';

  const email = text(src.email).trim().toLowerCase();
  if (!email) errors.email = 'Ingresá tu mail.';
  else if (email.length > 120 || !EMAIL_RE.test(email))
    errors.email = 'Revisá tu mail, parece incompleto.';

  const ocupacion = text(src.ocupacion);
  if (!(OCUPACIONES as readonly string[]).includes(ocupacion)) errors.ocupacion = 'Elegí una opción.';

  const especialidad = text(src.especialidad);
  const esOdontologo = ocupacion === OCUPACION_ODONTOLOGO;
  if (esOdontologo && !(ESPECIALIDADES as readonly string[]).includes(especialidad))
    errors.especialidad = 'Elegí tu especialidad.';

  if (src.acepto !== true) errors.acepto = 'Tenés que aceptar para participar.';

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      nombre,
      apellido,
      celular: phone.celular,
      celularNorm: phone.celularNorm,
      email,
      ocupacion,
      especialidad: esOdontologo ? especialidad : null,
    },
  };
}
