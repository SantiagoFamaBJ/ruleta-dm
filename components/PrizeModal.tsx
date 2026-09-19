'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { COLORS, INSTAGRAM_URL, LOGOS, LOGO_STYLE, WEB_URL, fillName, type PrizeType, type Texts } from '../lib/config';
import { useImageOk } from './Logo';

interface Props {
  name: string;
  type: PrizeType;
  prize: string;
  texts: Texts;
  /** Cierra el pop-up y deja el formulario listo para la próxima persona */
  onClose: () => void;
  /** Sale "Intentá de nuevo": vuelve a la ruleta para otra tirada */
  onRetry: () => void;
}

const CONFETTI_COLORS = ['#F15922', '#00A3E0', '#7B4BB7', '#FFC629', '#FFFFFF'];

/** Confeti sin librerías. Las posiciones salen de la cuenta (no del azar) para que sea siempre igual. */
function Confetti() {
  const pieces = Array.from({ length: 56 }, (_, i) => {
    const size = 7 + ((i * 5) % 7);
    return {
      left: (i * 37) % 100,
      delay: ((i * 7) % 10) * 0.07,
      duration: 2.6 + ((i * 3) % 6) * 0.3,
      drift: (i % 2 ? 1 : -1) * (10 + ((i * 11) % 60)),
      width: size,
      height: Math.round(size * 0.5),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    };
  });

  return (
    <div className="confetti-layer" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti"
          style={
            {
              left: `${p.left}%`,
              width: p.width,
              height: p.height,
              background: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              '--drift': `${p.drift}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

export default function PrizeModal({ name, type, prize, texts, onClose, onRetry }: Props) {
  const button = useRef<HTMLButtonElement>(null);
  const color = COLORS[type];
  const retry = type === 'reintentar';
  const won = type !== 'seguir' && !retry;
  const titles: Record<PrizeType, string> = {
    coltene: texts.titleColtene,
    densell: texts.titleDensell,
    descuento: texts.titleDescuento,
    seguir: texts.titleSeguir,
    reintentar: texts.titleRetry,
  };
  const kicker = retry ? texts.retryKicker : won ? texts.winKicker : texts.loseKicker;
  const logoSrc = type === 'coltene' ? LOGOS.coltene : type === 'densell' ? LOGOS.densell : '';
  const logoOk = useImageOk(logoSrc || LOGOS.dm);
  const showLogo = Boolean(logoSrc) && logoOk;

  useEffect(() => {
    button.current?.focus();
    // Vibra al ganar (solo en celulares y tablets Android; en iPhone y iPad no existe esta función)
    if (won && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([180, 90, 180, 90, 320]);
    }
  }, [won]);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="prize-title">
      {won && <div className="modal-rays" aria-hidden="true" />}
      {won && <Confetti />}
      <div className="modal-card pop-in">
        <div className="modal-head" style={{ background: color.bg, color: color.fg }}>
          {showLogo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoSrc}
              alt=""
              className="modal-logo"
              style={LOGO_STYLE === 'blanco' ? { filter: 'brightness(0) invert(1) drop-shadow(0 1px 2px rgb(0 0 0 / 0.3))' } : undefined}
            />
          )}
          <p className="modal-kicker">{fillName(kicker, name)}</p>
          <h2 id="prize-title" className="modal-title">
            {titles[type]}
          </h2>
        </div>

        {retry ? (
          <div className="modal-body">
            <p className="modal-note">{texts.retryNote}</p>
            <button ref={button} type="button" className="dm-btn" onClick={onRetry}>
              {texts.retryButton}
            </button>
          </div>
        ) : (
          <div className="modal-body">
            {won && <p className="modal-prize">{prize}</p>}
            <p className="modal-note">{won ? texts.redeem : texts.lost}</p>
            <div className="modal-cta">
              <p className="modal-cta-note">{texts.ctaNote}</p>
              <div className="modal-cta-buttons">
                <a className="dm-btn dm-btn--ghost dm-btn--cta" href={WEB_URL} target="_blank" rel="noopener noreferrer">
                  {texts.cta}
                </a>
                <a className="dm-btn dm-btn--ghost dm-btn--cta" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                  {texts.ctaInstagram}
                </a>
              </div>
            </div>
            <button ref={button} type="button" className="dm-btn" onClick={onClose}>
              {texts.close}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
