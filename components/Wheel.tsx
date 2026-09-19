'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { COLORS, LOGOS, LOGO_STYLE, SLICES, type PrizeType } from '../lib/config';
import { CX, CY, R_HUB, R_LIGHTS, R_OUT, R_SLICE, R_TEXT, SEG, SPIN_MS, polar, slicePath, targetRotation } from '../lib/wheel';
import { useImageOk } from './Logo';

type Phase = 'idle' | 'requesting' | 'spinning' | 'done';

interface WheelProps {
  /** Se llama al tocar el centro. Devuelve el gajo ganador (0 a 11), que define el servidor, o null si falló. */
  onSpin: () => Promise<number | null>;
  /** Se llama cuando la ruleta terminó de frenar. */
  onStop: (index: number) => void;
}

// Destellos alrededor de la ruleta (posición en % del tamaño, tamaño en px, demora en s)
const SPARKS = [
  { left: '-4%', top: '20%', size: 22, delay: 0 },
  { left: '98%', top: '26%', size: 18, delay: 0.7 },
  { left: '1%', top: '80%', size: 16, delay: 1.2 },
  { left: '95%', top: '84%', size: 24, delay: 0.35 },
  { left: '14%', top: '-2%', size: 14, delay: 0.95 },
  { left: '84%', top: '-1%', size: 16, delay: 1.5 },
];

export default function Wheel({ onSpin, onStop }: WheelProps) {
  const [rotation, setRotation] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const winner = useRef<number | null>(null);
  const finished = useRef(false);
  const onStopRef = useRef(onStop);
  const coltenLogo = useImageOk(LOGOS.coltene);
  const densellLogo = useImageOk(LOGOS.densell);

  const logoFor = (type: PrizeType): string | null =>
    type === 'coltene' && coltenLogo ? LOGOS.coltene : type === 'densell' && densellLogo ? LOGOS.densell : null;

  useEffect(() => {
    onStopRef.current = onStop;
  }, [onStop]);

  const finish = useCallback(() => {
    if (finished.current || winner.current === null) return;
    finished.current = true;
    setPhase('done');
    onStopRef.current(winner.current);
  }, []);

  // Plan B por si el navegador no avisa que terminó la animación
  useEffect(() => {
    if (phase !== 'spinning') return;
    const t = window.setTimeout(finish, SPIN_MS + 800);
    return () => window.clearTimeout(t);
  }, [phase, finish]);

  async function handleClick() {
    if (phase !== 'idle') return;
    setPhase('requesting');

    let result: number | null = null;
    try {
      result = await onSpin();
    } catch {
      result = null;
    }
    if (result === null || result < 0 || result >= SLICES.length) {
      setPhase('idle');
      return;
    }

    const index: number = result;
    winner.current = index;
    finished.current = false;
    setRotation((r) => targetRotation(r, index));
    setPhase('spinning');
  }

  const label = phase === 'idle' ? 'GIRAR' : phase === 'done' ? 'LISTO' : '···';

  return (
    <div className="wheel-wrap" data-phase={phase} role="group" aria-label="Ruleta de premios">
      {SPARKS.map((s, i) => (
        <svg
          key={i}
          className="spark"
          viewBox="0 0 24 24"
          aria-hidden="true"
          style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: `${s.delay}s` }}
        >
          <path d="M12 0 L14.4 9.6 L24 12 L14.4 14.4 L12 24 L9.6 14.4 L0 12 L9.6 9.6 Z" fill="#FFC629" />
        </svg>
      ))}

      <svg className="wheel-pointer" viewBox="0 0 60 80" aria-hidden="true">
        <path
          d="M30 78 C22 64 4 46 4 28 A26 26 0 0 1 56 28 C56 46 38 64 30 78 Z"
          fill="#F15922"
          stroke="#fff"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <circle cx="30" cy="28" r="8.5" fill="#fff" />
      </svg>

      <div
        className="wheel-rotor"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: phase === 'spinning' ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.6, 0.1, 1)` : 'none',
        }}
        onTransitionEnd={(e) => {
          if (e.target === e.currentTarget && e.propertyName === 'transform') finish();
        }}
      >
        <svg viewBox="0 0 500 500" aria-hidden="true">
          <defs>
            {/* Logo en silueta blanca con una sombrita para que se lea sobre cualquier color */}
            <filter id="logo-blanco" x="-10%" y="-20%" width="120%" height="140%">
              <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0" result="blanco" />
              <feDropShadow in="blanco" dx="0" dy="1" stdDeviation="1.2" floodColor="#000" floodOpacity="0.3" />
            </filter>
          </defs>
          <circle cx={CX} cy={CY} r={R_OUT} fill="#262626" />

          {SLICES.map((slice, i) => {
            const color = COLORS[slice.type];
            const mid = i * SEG + SEG / 2;
            const lines = slice.label;
            const size = lines.length === 1 ? 21 : 15.5;
            const lineHeight = size * 1.18;
            const logo = logoFor(slice.type);
            const cx = CX + R_TEXT;
            return (
              <g key={i}>
                <path d={slicePath(i)} fill={color.bg} stroke="#fff" strokeWidth={2.5} strokeLinejoin="round" />
                <g transform={`rotate(${mid - 90} ${CX} ${CY})`}>
                  {logo ? (
                    <image
                      href={logo}
                      x={cx - 56}
                      y={CY - 19}
                      width={112}
                      height={38}
                      preserveAspectRatio="xMidYMid meet"
                      filter={LOGO_STYLE === 'blanco' ? 'url(#logo-blanco)' : undefined}
                    />
                  ) : (
                    <text className="wheel-label" textAnchor="middle" fill={color.fg} fontSize={size}>
                      {lines.map((line, k) => (
                        <tspan key={k} x={cx} y={CY + size * 0.35 + (k - (lines.length - 1) / 2) * lineHeight}>
                          {line}
                        </tspan>
                      ))}
                    </text>
                  )}
                </g>
              </g>
            );
          })}

          {Array.from({ length: SLICES.length * 2 }, (_, i) => {
            const p = polar(R_LIGHTS, i * (SEG / 2));
            return (
              <circle
                key={i}
                className="wheel-light"
                style={{ animationDelay: `${(i % 2) * 0.7}s` }}
                cx={p.x}
                cy={p.y}
                r={4.5}
                fill="#fff"
              />
            );
          })}

          <circle cx={CX} cy={CY} r={R_HUB} fill="#262626" />
        </svg>
      </div>

      {/* Brillo y sombra suave (no gira): le da volumen a la ruleta */}
      <svg className="wheel-gloss" viewBox="0 0 500 500" aria-hidden="true">
        <defs>
          <radialGradient id="gloss-shine" cx="32%" cy="24%" r="62%">
            <stop offset="0" stopColor="#fff" stopOpacity="0.42" />
            <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="gloss-shade" cx="50%" cy="50%" r="50%">
            <stop offset="0.72" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.22" />
          </radialGradient>
        </defs>
        <circle cx={CX} cy={CY} r={R_SLICE} fill="url(#gloss-shade)" />
        <circle cx={CX} cy={CY} r={R_SLICE} fill="url(#gloss-shine)" />
      </svg>

      <button type="button" className="wheel-center" onClick={handleClick} disabled={phase !== 'idle'}>
        {label}
      </button>
    </div>
  );
}
