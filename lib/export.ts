import ExcelJS from 'exceljs';
import type { ParticipantRow } from './db';

const TZ = 'America/Argentina/Buenos_Aires';

const fmt = new Intl.DateTimeFormat('es-AR', {
  timeZone: TZ,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** "18/09/2026 15:32", en hora de Argentina */
export function fechaAR(iso: string): string {
  const parts = fmt.formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}`;
}

/** Del más viejo al más nuevo */
function porFecha(rows: ParticipantRow[]): ParticipantRow[] {
  return [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

/* ------------------------------ Excel (.xlsx) ------------------------------ */

const XLSX_COLUMNS: { header: string; key: string; width: number }[] = [
  { header: 'Fecha', key: 'fecha', width: 18 },
  { header: 'Nombre', key: 'nombre', width: 18 },
  { header: 'Apellido', key: 'apellido', width: 20 },
  { header: 'Celular', key: 'celular', width: 16 },
  { header: 'Mail', key: 'email', width: 34 },
  { header: 'Ocupación', key: 'ocupacion', width: 16 },
  { header: 'Especialidad', key: 'especialidad', width: 26 },
  { header: 'Premio', key: 'premio', width: 24 },
];

export async function buildXlsx(rows: ParticipantRow[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Dental Medrano';
  wb.created = new Date();

  const ws = wb.addWorksheet('Participantes', { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.columns = XLSX_COLUMNS;
  ws.getColumn('celular').numFmt = '@'; // texto: no se pierden ceros ni el "+"

  for (const r of porFecha(rows)) {
    ws.addRow({
      fecha: fechaAR(r.created_at),
      nombre: r.nombre,
      apellido: r.apellido,
      celular: r.celular,
      email: r.email,
      ocupacion: r.ocupacion,
      especialidad: r.especialidad ?? '',
      premio: r.premio,
    });
  }

  const header = ws.getRow(1);
  header.height = 22;
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF15922' } };
    cell.alignment = { vertical: 'middle' };
  });
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: XLSX_COLUMNS.length } };

  return Buffer.from(await wb.xlsx.writeBuffer());
}

/* --------------------------- CSV para Emblue (.csv) --------------------------- */

type CsvColumn = { header: string; get: (r: ParticipantRow) => string };

// Encabezados en minúscula y sin tildes, para que Emblue los reconozca al mapear campos.
const CSV_COLUMNS: CsvColumn[] = [
  { header: 'email', get: (r) => r.email },
  { header: 'nombre', get: (r) => r.nombre },
  { header: 'apellido', get: (r) => r.apellido },
  { header: 'celular', get: (r) => r.celular.replace(/^\+/, '') }, // solo números
  { header: 'ocupacion', get: (r) => r.ocupacion },
  { header: 'especialidad', get: (r) => r.especialidad ?? '' },
  { header: 'premio', get: (r) => r.premio },
];

function csvCell(value: string, delimiter: string): string {
  return value.includes(delimiter) || /["\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * CSV en UTF-8 (con BOM, para que Excel también lea bien las tildes).
 * Emblue no acepta columnas totalmente vacías, así que se sacan
 * (por ejemplo "especialidad" si no participó ningún odontólogo).
 */
export function buildEmblueCsv(rows: ParticipantRow[], delimiter: ';' | ',' = ';'): string {
  const data = porFecha(rows);
  const cols = data.length ? CSV_COLUMNS.filter((c) => data.some((r) => c.get(r) !== '')) : CSV_COLUMNS;

  const lines = [
    cols.map((c) => c.header).join(delimiter),
    ...data.map((r) => cols.map((c) => csvCell(c.get(r), delimiter)).join(delimiter)),
  ];
  return '\uFEFF' + lines.join('\r\n') + '\r\n';
}
