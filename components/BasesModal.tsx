'use client';

import { useEffect, useRef } from 'react';

/** Bases y condiciones en un pop-up (así la tablet no sale de la ruleta). El texto se edita desde /admin. */
export default function BasesModal({ text, onClose }: { text: string; onClose: () => void }) {
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    close.current?.focus();
  }, []);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="bases-title" onClick={onClose}>
      <div className="modal-card bases-card pop-in" onClick={(e) => e.stopPropagation()}>
        <h2 id="bases-title" className="bases-title">
          Bases y condiciones
        </h2>
        <div className="bases-body">{text}</div>
        <div className="bases-foot">
          <button ref={close} type="button" className="dm-btn" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
