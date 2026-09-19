/**
 * Configuración de la ruleta de Dental Medrano.
 * Los textos y los nombres de los premios también se pueden cambiar desde /admin.
 */

export type PrizeType = 'coltene' | 'densell' | 'seguir' | 'descuento';

export interface Slice {
  /** Categoría del gajo (define el color) */
  type: PrizeType;
  /** Texto que se ve dentro del gajo (si no hay logo), una línea por elemento */
  label: string[];
  /** Premio por defecto (se cambia desde /admin) */
  prize: string;
}

/** bg = color del gajo · fg = color del texto */
export const COLORS: Record<PrizeType, { bg: string; fg: string }> = {
  coltene: { bg: '#00A3E0', fg: '#00325A' }, // celeste COLTENE (alternativa más oscura: #004B87 con texto blanco)
  densell: { bg: '#F15922', fg: '#FFFFFF' }, // naranja Dental Medrano
  seguir: { bg: '#7B4BB7', fg: '#FFFFFF' }, // violeta
  descuento: { bg: '#FFC629', fg: '#262626' }, // amarillo
};

/** Link del botón y del QR del pop-up (el QR es el archivo public/qr-web.svg: si cambiás el link, hay que regenerarlo) */
export const WEB_URL = 'https://dentalmedrano.com/?utm_source=ruleta&utm_medium=local&utm_campaign=semana-odontologo';

/** Instagram de Dental Medrano (botón del pop-up) */
export const INSTAGRAM_URL = 'https://www.instagram.com/dentalmedrano/';

/** Logos: archivos PNG dentro de public/logos/. Si falta uno se muestra el texto. */
export const LOGOS = {
  dm: '/logos/dm.png',
  coltene: '/logos/coltene.png',
  densell: '/logos/densell.png',
};

/**
 * Cómo se ven los logos sobre los colores:
 *  'blanco'   -> silueta blanca (queda prolijo sobre celeste y naranja; necesita PNG con fondo transparente)
 *  'original' -> con sus colores tal cual el archivo
 */
export const LOGO_STYLE: 'blanco' | 'original' = 'blanco';

/** Los 12 gajos, en orden (arrancan arriba y siguen en sentido horario). Todos tienen 1 chance de 12. */
export const SLICES: Slice[] = [
  { type: 'coltene', label: ['COLTENE'], prize: 'Premio COLTENE 1' },
  { type: 'densell', label: ['DENSELL'], prize: 'Premio Densell 1' },
  { type: 'seguir', label: ['SEGUÍ', 'PARTICIPANDO'], prize: 'Seguí participando' },
  { type: 'descuento', label: ['10% OFF'], prize: '10% de descuento' },

  { type: 'coltene', label: ['COLTENE'], prize: 'Premio COLTENE 2' },
  { type: 'densell', label: ['DENSELL'], prize: 'Premio Densell 2' },
  { type: 'seguir', label: ['SEGUÍ', 'PARTICIPANDO'], prize: 'Seguí participando' },
  { type: 'descuento', label: ['10% OFF'], prize: '10% de descuento' },

  { type: 'coltene', label: ['COLTENE'], prize: 'Premio COLTENE 3' },
  { type: 'densell', label: ['DENSELL'], prize: 'Premio Densell 3' },
  { type: 'seguir', label: ['SEGUÍ', 'PARTICIPANDO'], prize: 'Seguí participando' },
  { type: 'descuento', label: ['10% OFF'], prize: '10% de descuento' },
];

export const OCUPACION_ODONTOLOGO = 'Odontólogo/a';

export const OCUPACIONES = ['Estudiante', OCUPACION_ODONTOLOGO, 'Otro'] as const;

/** Se muestran solo si la ocupación es Odontólogo/a */
export const ESPECIALIDADES = [
  'Odontología general',
  'Ortodoncia',
  'Endodoncia',
  'Implantología',
  'Periodoncia',
  'Cirugía bucomaxilofacial',
  'Odontopediatría',
  'Rehabilitación oral',
  'Odontología estética',
  'Diagnóstico por imágenes',
  'Otra',
] as const;

/* ------------------------- Parte editable desde /admin ------------------------- */

export interface Texts {
  banner: string;
  title: string;
  subtitle: string;
  consent: string;
  submit: string;
  greeting: string;
  spinHint: string;
  winKicker: string;
  loseKicker: string;
  titleColtene: string;
  titleDensell: string;
  titleDescuento: string;
  titleSeguir: string;
  redeem: string;
  lost: string;
  ctaNote: string;
  cta: string;
  close: string;
  bases: string;
  ctaInstagram: string;
}

const DEFAULT_BASES = `BASES Y CONDICIONES - RULETA DE PREMIOS
Semana del Odontólogo - Dental Medrano

1. Organizador y lugar
La acción "Ruleta de premios" es organizada por Dental Medrano (el "Organizador") y se realiza únicamente en forma presencial, en el local de Dental Medrano, durante los días de la Semana del Odontólogo en que el Organizador la habilite.

2. Quiénes pueden participar
Pueden participar personas mayores de 18 años que completen el formulario con datos verdaderos y acepten estas bases. Cada persona participa una sola vez: no se admite más de una participación con el mismo mail o el mismo celular.

3. Cómo se participa
Se completan los datos del formulario, se aceptan estas bases y se gira la ruleta una vez. El resultado lo define el sistema de manera aleatoria, no puede modificarse y todos los casilleros de la ruleta tienen la misma probabilidad de salir.

4. Premios
La ruleta puede dar un premio de las marcas COLTENE o Densell, un descuento del 10% en Dental Medrano, o el resultado "Seguí participando", que no otorga premio. Los premios se retiran en el local, en el momento, mostrando al personal de Dental Medrano la pantalla con el resultado. No son canjeables por dinero ni transferibles. El descuento del 10% se aplica según las condiciones que informe el personal del local al momento de la entrega.

5. Datos personales
Los datos que se ingresan (nombre, apellido, celular, mail, ocupación y especialidad) se usan para gestionar la participación y la entrega del premio y, con la aceptación de estas bases, para que Dental Medrano se comunique con la persona para enviarle novedades, ofertas y promociones por mail y por celular (incluido WhatsApp). Los datos se incorporan a una base de datos de Dental Medrano, responsable de su tratamiento, y solo se comparten con proveedores que prestan servicios de almacenamiento y envío de comunicaciones. La persona puede pedir en cualquier momento el acceso, la rectificación o la supresión de sus datos, y dejar de recibir comunicaciones, llamando al 11 6436-2400 o escribiendo desde dentalmedrano.com.

El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto conforme lo establecido en el artículo 14, inciso 3 de la Ley Nº 25.326. La Agencia de Acceso a la Información Pública, en su carácter de Órgano de Control de la Ley Nº 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.

6. Modificaciones y suspensión
El Organizador puede modificar, suspender o cancelar la acción por razones técnicas o de fuerza mayor, y puede excluir participaciones con datos falsos o intentos de fraude.

7. Aceptación
La participación implica la aceptación de estas bases y condiciones.`;

export const DEFAULT_TEXTS: Texts = {
  banner: '¡Feliz semana del Odontólogo!',
  title: 'Ruleta de premios',
  subtitle: 'Completá tus datos y probá tu suerte.',
  consent: 'Acepto las bases y condiciones y que Dental Medrano use mis datos para comunicarse conmigo.',
  submit: 'Ir a la ruleta',
  greeting: '¡Suerte, {nombre}!',
  spinHint: 'Tocá el centro de la ruleta para girar.',
  winKicker: '¡Felicitaciones, {nombre}!',
  loseKicker: 'Gracias por participar, {nombre}',
  titleColtene: 'Ganaste un premio COLTENE',
  titleDensell: 'Ganaste un premio Densell',
  titleDescuento: 'Ganaste 10% OFF',
  titleSeguir: 'Seguí participando',
  redeem: 'Mostrale esta pantalla a nuestro equipo para retirar tu premio.',
  lost: 'Esta vez no salió premio, pero seguí participando de nuestras próximas acciones.',
  ctaNote: 'Conocé todo lo que tenemos para vos.',
  cta: 'Visitá dentalmedrano.com',
  close: 'Listo',
  bases: DEFAULT_BASES,
  ctaInstagram: 'Seguinos en Instagram',
};

export const TEXT_LIMITS: Record<keyof Texts, number> = {
  banner: 60,
  title: 40,
  subtitle: 120,
  consent: 220,
  submit: 30,
  greeting: 50,
  spinHint: 80,
  winKicker: 50,
  loseKicker: 50,
  titleColtene: 50,
  titleDensell: 50,
  titleDescuento: 50,
  titleSeguir: 50,
  redeem: 160,
  lost: 160,
  ctaNote: 80,
  cta: 40,
  close: 20,
  bases: 8000,
  ctaInstagram: 40,
};

/** Reemplaza {nombre} por el nombre de la persona */
export function fillName(text: string, name: string): string {
  return text.replace(/\{nombre\}/gi, name);
}

export interface RuletaConfig {
  texts: Texts;
  /** Un premio por gajo, en el mismo orden que SLICES */
  prizes: string[];
}

export const DEFAULT_CONFIG: RuletaConfig = {
  texts: DEFAULT_TEXTS,
  prizes: SLICES.map((s) => s.prize),
};

/** Toma lo que venga (base de datos o formulario del admin) y devuelve una config siempre válida */
export function normalizeConfig(input: unknown): RuletaConfig {
  const src = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const rawTexts = (src.texts && typeof src.texts === 'object' ? src.texts : {}) as Record<string, unknown>;

  const texts: Texts = { ...DEFAULT_TEXTS };
  for (const key of Object.keys(DEFAULT_TEXTS) as (keyof Texts)[]) {
    const v = rawTexts[key];
    if (typeof v === 'string' && v.trim()) texts[key] = v.trim().slice(0, TEXT_LIMITS[key]);
  }

  const rawPrizes = Array.isArray(src.prizes) ? src.prizes : [];
  const prizes = SLICES.map((s, i) => {
    const v = rawPrizes[i];
    return typeof v === 'string' && v.trim() ? v.trim().slice(0, 80) : s.prize;
  });

  return { texts, prizes };
}
