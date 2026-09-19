'use client';

import { useEffect, useState } from 'react';
import { LOGOS } from '../lib/config';

/** true si el archivo de imagen existe y carga bien (para caer a texto si todavía no está el logo) */
export function useImageOk(src: string): boolean {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const img = new Image();
    img.onload = () => setOk(true);
    img.onerror = () => setOk(false);
    img.src = src;
  }, [src]);
  return ok;
}

/** Logo de Dental Medrano (public/logos/dm.png). Si no está, queda el nombre en texto. */
export function BrandLogo() {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="app-brand">Dental Medrano</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={LOGOS.dm} alt="Dental Medrano" className="app-logo" onError={() => setFailed(true)} />
  );
}

/** Cartel de bienvenida (se edita desde /admin), con destellos alrededor */
export function Banner({ text }: { text: string }) {
  const star = (cls: string) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`banner-star ${cls}`}>
      <path d="M12 0 L14.4 9.6 L24 12 L14.4 14.4 L12 24 L9.6 14.4 L0 12 L9.6 9.6 Z" fill="currentColor" />
    </svg>
  );
  return (
    <p className="banner">
      <span>{text}</span>
      {star('banner-star--a')}
      {star('banner-star--b')}
      {star('banner-star--c')}
    </p>
  );
}
