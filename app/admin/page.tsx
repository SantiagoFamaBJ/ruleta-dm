'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { BrandLogo } from '../../components/Logo';
import { COLORS, DEFAULT_CONFIG, SLICES, TEXT_LIMITS, type PrizeType, type RuletaConfig, type Texts } from '../../lib/config';

interface Row {
  id: string;
  created_at: string;
  nombre: string;
  apellido: string;
  celular: string;
  email: string;
  ocupacion: string;
  especialidad: string | null;
  premio_tipo: PrizeType;
  premio: string;
  entregado: boolean;
  entregado_at: string | null;
}

const CATEGORIES: { type: PrizeType; label: string }[] = [
  { type: 'coltene', label: 'COLTENE' },
  { type: 'densell', label: 'Densell' },
  { type: 'descuento', label: '10% OFF' },
  { type: 'seguir', label: 'Seguí participando' },
];

const TEXT_GROUPS: { title: string; hint?: string; fields: [keyof Texts, string, boolean][] }[] = [
  {
    title: 'Pantalla de inicio',
    fields: [
      ['banner', 'Mensaje de bienvenida (arriba de todo)', false],
      ['title', 'Título', false],
      ['subtitle', 'Subtítulo', false],
      ['consent', 'Texto del checkbox (bases y datos)', true],
      ['submit', 'Botón para ir a la ruleta', false],
      ['bases', 'Bases y condiciones (texto completo)', true],
    ],
  },
  {
    title: 'Pantalla de la ruleta',
    hint: 'Podés escribir {nombre} y se reemplaza por el nombre de la persona.',
    fields: [
      ['greeting', 'Saludo', false],
      ['spinHint', 'Indicación para girar', false],
    ],
  },
  {
    title: 'Pop-up del resultado',
    hint: 'En los dos primeros podés usar {nombre}.',
    fields: [
      ['winKicker', 'Frase cuando gana', false],
      ['loseKicker', 'Frase cuando sale "Seguí participando"', false],
      ['titleColtene', 'Título cuando sale COLTENE', false],
      ['titleDensell', 'Título cuando sale Densell', false],
      ['titleDescuento', 'Título cuando sale el descuento', false],
      ['titleSeguir', 'Título cuando sale "Seguí participando"', false],
      ['redeem', 'Mensaje al ganar un premio', true],
      ['lost', 'Mensaje cuando no sale premio', true],
      ['ctaNote', 'Texto arriba del botón de la web', false],
      ['cta', 'Botón que lleva a dentalmedrano.com', false],
      ['ctaInstagram', 'Botón que lleva a Instagram', false],
      ['close', 'Botón para cerrar', false],
      ['titleRetry', 'Título cuando sale "Intentá de nuevo"', false],
      ['retryKicker', 'Frase cuando sale "Intentá de nuevo"', false],
      ['retryNote', 'Mensaje cuando sale "Intentá de nuevo"', false],
      ['retryButton', 'Botón para volver a girar', false],
    ],
  },
];

const dateFmt = new Intl.DateTimeFormat('es-AR', {
  timeZone: 'America/Argentina/Buenos_Aires',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [delimiter, setDelimiter] = useState<';' | ','>(';');
  const [tab, setTab] = useState<'participantes' | 'stats' | 'textos'>('participantes');
  const [config, setConfig] = useState<RuletaConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState('');
  const [onlyPending, setOnlyPending] = useState(false);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of rows ?? []) c[r.premio_tipo] = (c[r.premio_tipo] ?? 0) + 1;
    return c;
  }, [rows]);

  function call(action: string, extra: Record<string, unknown> = {}) {
    return fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, action, ...extra }),
    });
  }

  async function load(e?: FormEvent) {
    e?.preventDefault();
    setError('');
    setBusy(true);
    try {
      const [res, resConfig] = await Promise.all([call('list'), call('getConfig')]);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'No se pudo cargar.');
        return;
      }
      const dataConfig = await resConfig.json().catch(() => ({}));
      if (dataConfig.config) setConfig(dataConfig.config as RuletaConfig);
      setRows(data.rows as Row[]);
    } catch {
      setError('No hay conexión. Probá de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  async function download(kind: 'xlsx' | 'csv') {
    setError('');
    setBusy(true);
    try {
      const res = await call(kind, kind === 'csv' ? { delimiter } : {});
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'No se pudo descargar.');
        return;
      }
      const blob = await res.blob();
      const today = new Date().toISOString().slice(0, 10);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = kind === 'xlsx' ? `ruleta-dental-medrano_${today}.xlsx` : `ruleta-dental-medrano-emblue_${today}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    } catch {
      setError('No hay conexión. Probá de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(row: Row) {
    if (!window.confirm(`¿Eliminar a ${row.nombre} ${row.apellido}? Esto no se puede deshacer.`)) return;
    setError('');
    setBusy(true);
    try {
      const res = await call('delete', { id: row.id });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'No se pudo eliminar.');
        return;
      }
      setRows((prev) => (prev ? prev.filter((r) => r.id !== row.id) : prev));
    } catch {
      setError('No hay conexión. Probá de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  async function setDelivered(row: Row, value: boolean) {
    setError('');
    setBusy(true);
    try {
      const res = await call('deliver', { id: row.id, value });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'No se pudo actualizar.');
        return;
      }
      setRows((prev) =>
        prev ? prev.map((r) => (r.id === row.id ? { ...r, entregado: value, entregado_at: data.entregado_at ?? null } : r)) : prev,
      );
    } catch {
      setError('No hay conexión. Probá de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  const visibleRows = (rows ?? []).filter((r) => !onlyPending || (r.premio_tipo !== 'seguir' && !r.entregado));

  function setText(key: keyof Texts, value: string) {
    setSaved('');
    setConfig((c) => ({ ...c, texts: { ...c.texts, [key]: value } }));
  }

  function setPrize(id: string, value: string) {
    setSaved('');
    setConfig((c) => ({ ...c, prizes: { ...c.prizes, [id]: value } }));
  }

  async function saveConfig() {
    setError('');
    setSaved('');
    setBusy(true);
    try {
      const res = await call('saveConfig', { config });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'No se pudo guardar.');
        return;
      }
      setConfig(data.config as RuletaConfig);
      setSaved('Guardado. Recargá la ruleta para ver los cambios.');
    } catch {
      setError('No hay conexión. Probá de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    setPassword('');
    setRows(null);
    setError('');
  }

  if (!rows) {
    return (
      <div className="app-shell">
        <header className="app-header">
          <BrandLogo />
        </header>
        <main className="app-main">
          <div className="form-wrap">
            <h1 className="screen-title">Participantes</h1>
            <p className="screen-sub">Ingresá la clave para ver y descargar los datos.</p>
            <form onSubmit={load} className="mt-8 flex flex-col gap-5">
              <div>
                <label className="dm-label" htmlFor="admin-password">
                  Clave
                </label>
                <input
                  id="admin-password"
                  className="dm-input"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={error ? true : undefined}
                />
                {error && <p className="dm-error">{error}</p>}
              </div>
              <button type="submit" className="dm-btn" disabled={busy || !password}>
                {busy ? 'Entrando…' : 'Entrar'}
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <BrandLogo />
      </header>
      <main className="app-main" style={{ alignItems: 'stretch', maxWidth: 1100, width: '100%', margin: '0 auto' }}>
        <div className="mb-6 flex flex-wrap gap-2">
          <button type="button" className={`dm-btn dm-btn--sm ${tab === 'participantes' ? '' : 'dm-btn--ghost'}`} onClick={() => setTab('participantes')}>
            Participantes
          </button>
          <button type="button" className={`dm-btn dm-btn--sm ${tab === 'stats' ? '' : 'dm-btn--ghost'}`} onClick={() => setTab('stats')}>
            Estadísticas
          </button>
          <button type="button" className={`dm-btn dm-btn--sm ${tab === 'textos' ? '' : 'dm-btn--ghost'}`} onClick={() => setTab('textos')}>
            Textos y premios
          </button>
        </div>

        {tab === 'textos' ? (
          <div className="max-w-2xl">
            <h1 className="screen-title" style={{ textAlign: 'left' }}>Textos y premios</h1>
            <p className="screen-sub" style={{ textAlign: 'left' }}>
              Lo que escribas acá aparece en la ruleta al recargarla. Los premios ya entregados no cambian.
            </p>

            {TEXT_GROUPS.map((group) => (
              <section key={group.title} className="mt-8">
                <h2 className="font-heading text-xl font-extrabold">{group.title}</h2>
                {group.hint && (
                  <p className="mt-1 text-sm" style={{ color: 'var(--dm-muted)' }}>
                    {group.hint}
                  </p>
                )}
                <div className="mt-4 flex flex-col gap-5">
                  {group.fields.map(([key, label, long]) => (
                    <div key={key}>
                      <label className="dm-label" htmlFor={`t-${key}`}>
                        {label}
                      </label>
                      {long ? (
                        <textarea
                          id={`t-${key}`}
                          className="dm-input"
                          style={{ height: 'auto', padding: '12px 16px' }}
                          rows={key === 'bases' ? 14 : 3}
                          maxLength={TEXT_LIMITS[key]}
                          value={config.texts[key]}
                          onChange={(e) => setText(key, e.target.value)}
                        />
                      ) : (
                        <input
                          id={`t-${key}`}
                          className="dm-input"
                          maxLength={TEXT_LIMITS[key]}
                          value={config.texts[key]}
                          onChange={(e) => setText(key, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}

            <h2 className="mt-10 font-heading text-xl font-extrabold">Premios de cada gajo</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              {SLICES.map((slice) => {
                if (slice.type === 'seguir' || slice.type === 'reintentar') return null;
                const n = slice.id.split('-')[1];
                const name = slice.type === 'coltene' ? 'COLTENE' : slice.type === 'densell' ? 'Densell' : '10% OFF';
                return (
                  <div key={slice.id}>
                    <label className="dm-label" htmlFor={`p-${slice.id}`}>
                      <span
                        className="mr-2 inline-block h-3 w-3 rounded-full align-middle"
                        style={{ background: COLORS[slice.type].bg }}
                      />
                      {name} {n}
                    </label>
                    <input
                      id={`p-${slice.id}`}
                      className="dm-input"
                      maxLength={80}
                      value={config.prizes[slice.id] ?? ''}
                      onChange={(e) => setPrize(slice.id, e.target.value)}
                    />
                  </div>
                );
              })}
            </div>

            {error && (
              <p role="alert" className="dm-notice mt-6">
                {error}
              </p>
            )}
            {saved && (
              <p role="status" className="mt-6 font-semibold" style={{ color: '#2e7d32' }}>
                {saved}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" className="dm-btn dm-btn--sm" onClick={saveConfig} disabled={busy}>
                {busy ? 'Guardando…' : 'Guardar cambios'}
              </button>
              <button
                type="button"
                className="dm-btn dm-btn--sm dm-btn--ghost"
                onClick={() => {
                  setSaved('');
                  setConfig(DEFAULT_CONFIG);
                }}
              >
                Volver a los textos originales
              </button>
            </div>
          </div>
        ) : tab === 'stats' ? (
          <StatsPanel rows={rows} />
        ) : (
        <>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="screen-title" style={{ textAlign: 'left' }}>
              {rows.length} {rows.length === 1 ? 'participante' : 'participantes'}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <span
                  key={c.type}
                  className="rounded-full px-3 py-1 text-sm font-semibold"
                  style={{ background: COLORS[c.type].bg, color: COLORS[c.type].fg }}
                >
                  {c.label}: {counts[c.type] ?? 0}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="dm-btn dm-btn--sm dm-btn--ghost" onClick={() => load()} disabled={busy}>
              Actualizar
            </button>
            <button type="button" className="dm-btn dm-btn--sm dm-btn--ghost" onClick={logout}>
              Salir
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button type="button" className="dm-btn dm-btn--sm" onClick={() => download('xlsx')} disabled={busy || rows.length === 0}>
            Descargar Excel
          </button>
          <button type="button" className="dm-btn dm-btn--sm" onClick={() => download('csv')} disabled={busy || rows.length === 0}>
            Descargar CSV para Emblue
          </button>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} />
            <span>Solo premios sin entregar</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span>Separador del CSV</span>
            <select
              className="dm-input"
              style={{ height: 44, width: 'auto', paddingRight: 40 }}
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value === ',' ? ',' : ';')}
            >
              <option value=";">Punto y coma ( ; )</option>
              <option value=",">Coma ( , )</option>
            </select>
          </label>
        </div>

        {error && (
          <p role="alert" className="dm-notice mt-4">
            {error}
          </p>
        )}

        <div className="mt-6 overflow-x-auto rounded-2xl" style={{ boxShadow: 'inset 0 0 0 1.5px var(--dm-line)' }}>
          <table className="w-full min-w-[820px] border-collapse text-left text-[15px]">
            <thead>
              <tr className="text-sm" style={{ background: '#fafafa' }}>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Celular</th>
                <th className="px-4 py-3 font-semibold">Mail</th>
                <th className="px-4 py-3 font-semibold">Ocupación</th>
                <th className="px-4 py-3 font-semibold">Premio</th>
                <th className="px-4 py-3 font-semibold">Entrega</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center" style={{ color: 'var(--dm-muted)' }}>
                    Todavía no participó nadie.
                  </td>
                </tr>
              )}
              {visibleRows.map((r) => (
                <tr key={r.id} style={{ borderTop: '1px solid #ececec' }}>
                  <td className="whitespace-nowrap px-4 py-3">{dateFmt.format(new Date(r.created_at))}</td>
                  <td className="px-4 py-3 font-medium">
                    {r.nombre} {r.apellido}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{r.celular}</td>
                  <td className="px-4 py-3">{r.email}</td>
                  <td className="px-4 py-3">
                    {r.ocupacion}
                    {r.especialidad ? ` · ${r.especialidad}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-block rounded-full px-3 py-1 text-sm font-semibold"
                      style={{ background: COLORS[r.premio_tipo]?.bg ?? '#eee', color: COLORS[r.premio_tipo]?.fg ?? '#262626' }}
                    >
                      {r.premio}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {r.premio_tipo === 'seguir' ? (
                      <span style={{ color: 'var(--dm-muted)' }}>—</span>
                    ) : r.entregado ? (
                      <span>
                        <span className="font-semibold" style={{ color: '#2e7d32' }}>
                          Entregado ✓
                        </span>{' '}
                        <button
                          type="button"
                          className="text-sm underline underline-offset-2"
                          style={{ color: 'var(--dm-muted)' }}
                          onClick={() => setDelivered(r, false)}
                          disabled={busy}
                        >
                          Deshacer
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="dm-btn dm-btn--sm dm-btn--ghost"
                        style={{ height: 36, padding: '0 14px', fontSize: 14 }}
                        onClick={() => setDelivered(r, true)}
                        disabled={busy}
                      >
                        Marcar entregado
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="text-sm underline underline-offset-2"
                      style={{ color: 'var(--dm-error)' }}
                      onClick={() => remove(r)}
                      disabled={busy}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
        )}
      </main>
    </div>
  );
}


/* ------------------------------- Estadísticas ------------------------------- */

const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }); // 2026-09-19

interface BarItem {
  label: string;
  value: number;
  color?: string;
}

function BarList({ title, items }: { title: string; items: BarItem[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const total = items.reduce((sum, i) => sum + i.value, 0);
  return (
    <section className="rounded-2xl p-5" style={{ boxShadow: 'inset 0 0 0 1.5px var(--dm-line)' }}>
      <h2 className="font-heading text-lg font-extrabold">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm" style={{ color: 'var(--dm-muted)' }}>
          Sin datos todavía.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.label}>
              <div className="flex justify-between gap-3 text-sm">
                <span>{item.label}</span>
                <span className="whitespace-nowrap font-semibold">
                  {item.value} · {Math.round((item.value / total) * 100)}%
                </span>
              </div>
              <div className="mt-1 h-3 rounded-full" style={{ background: '#f1f1f1' }}>
                <div
                  className="h-3 rounded-full"
                  style={{ width: `${(item.value / max) * 100}%`, background: item.color ?? 'var(--dm-orange)' }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function tally(values: string[]): BarItem[] {
  const map = new Map<string, number>();
  for (const v of values) map.set(v, (map.get(v) ?? 0) + 1);
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

function StatsPanel({ rows }: { rows: Row[] }) {
  const stats = useMemo(() => {
    const today = dayKey.format(new Date());
    const perDay = new Map<string, number>();
    for (const r of rows) {
      const k = dayKey.format(new Date(r.created_at));
      perDay.set(k, (perDay.get(k) ?? 0) + 1);
    }
    const days: BarItem[] = [...perDay.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, value]) => ({ label: `${k.slice(8, 10)}/${k.slice(5, 7)}`, value }));

    const odontologos = rows.filter((r) => r.especialidad);
    const ganaron = rows.filter((r) => r.premio_tipo !== 'seguir').length;

    return {
      total: rows.length,
      hoy: perDay.get(today) ?? 0,
      pctOdonto: rows.length ? Math.round((odontologos.length / rows.length) * 100) : 0,
      pctPremio: rows.length ? Math.round((ganaron / rows.length) * 100) : 0,
      ganaron,
      entregados: rows.filter((r) => r.premio_tipo !== 'seguir' && r.entregado).length,
      days,
      ocupacion: tally(rows.map((r) => r.ocupacion)),
      especialidad: tally(odontologos.map((r) => r.especialidad as string)),
      premios: (['coltene', 'densell', 'descuento', 'seguir'] as PrizeType[])
        .map((type) => ({
          label: CATEGORIES.find((c) => c.type === type)?.label ?? type,
          value: rows.filter((r) => r.premio_tipo === type).length,
          color: COLORS[type].bg,
        }))
        .filter((i) => i.value > 0),
    };
  }, [rows]);

  const kpis: [string, string][] = [
    ['Participantes', String(stats.total)],
    ['Hoy', String(stats.hoy)],
    ['Odontólogos', `${stats.pctOdonto}%`],
    ['Ganaron premio', `${stats.pctPremio}%`],
    ['Entregados', `${stats.entregados} de ${stats.ganaron}`],
  ];

  return (
    <div>
      <h1 className="screen-title" style={{ textAlign: 'left' }}>
        Estadísticas
      </h1>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map(([label, value]) => (
          <div key={label} className="rounded-2xl p-4" style={{ boxShadow: 'inset 0 0 0 1.5px var(--dm-line)' }}>
            <p className="text-sm" style={{ color: 'var(--dm-muted)' }}>
              {label}
            </p>
            <p className="font-heading text-3xl font-extrabold">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <BarList title="Participantes por día" items={stats.days} />
        <BarList title="Premios" items={stats.premios} />
        <BarList title="Ocupación" items={stats.ocupacion} />
        <BarList title="Especialidad (odontólogos)" items={stats.especialidad} />
      </div>
      <p className="mt-6 text-sm" style={{ color: 'var(--dm-muted)' }}>
        Los clics a dentalmedrano.com se miden en GA4 (fuente “ruleta”, campaña “semana-odontologo”).
      </p>
    </div>
  );
}
