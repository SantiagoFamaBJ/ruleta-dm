'use client';

import { useState } from 'react';
import { fillName, type PrizeType, type RuletaConfig } from '../lib/config';
import type { CleanParticipant, ParticipantInput } from '../lib/validation';
import { Banner, BrandLogo } from './Logo';
import PrizeModal from './PrizeModal';
import RegistrationForm from './RegistrationForm';
import Wheel from './Wheel';

type Step = 'form' | 'wheel';

interface SpinResult {
  index: number;
  type: PrizeType;
  prize: string;
}

interface DuplicateError {
  field: 'email' | 'celular';
  message: string;
}

/** UUID v4. crypto.randomUUID solo existe en HTTPS o localhost, por eso el plan B. */
function newToken(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0'));
  return `${h.slice(0, 4).join('')}-${h.slice(4, 6).join('')}-${h.slice(6, 8).join('')}-${h.slice(8, 10).join('')}-${h.slice(10).join('')}`;
}

export default function RuletaApp({ config }: { config: RuletaConfig }) {
  const [step, setStep] = useState<Step>('form');
  const [values, setValues] = useState<ParticipantInput | null>(null);
  const [person, setPerson] = useState<CleanParticipant | null>(null);
  const [token, setToken] = useState('');
  const [duplicate, setDuplicate] = useState<DuplicateError | null>(null);
  const [spinError, setSpinError] = useState('');
  const [busy, setBusy] = useState(false); // ya se tocó "Girar": no se pueden editar los datos
  const [result, setResult] = useState<SpinResult | null>(null);
  const [showPrize, setShowPrize] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [retryKey, setRetryKey] = useState(0);

  function handleReady(input: ParticipantInput, clean: CleanParticipant) {
    setValues(input);
    setPerson(clean);
    setToken(newToken());
    setDuplicate(null);
    setSpinError('');
    setStep('wheel');
  }

  /** Pide el resultado al servidor. Devuelve el gajo ganador (0 a 11) o null si no se pudo. */
  async function handleSpin(): Promise<number | null> {
    if (!values) return null;
    setSpinError('');
    setBusy(true);
    try {
      const res = await fetch('/api/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, token }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 409) {
        // Alguien participó con estos datos justo en el medio: vuelve al formulario.
        setDuplicate({ field: data.field === 'celular' ? 'celular' : 'email', message: data.error ?? 'Ya participaste.' });
        setBusy(false);
        setStep('form');
        return null;
      }
      if (!res.ok) {
        setSpinError(data.error ?? 'No se pudo girar. Probá de nuevo.');
        setBusy(false);
        return null;
      }

      setResult({ index: data.index, type: data.type, prize: data.prize });
      return data.index as number;
    } catch {
      setSpinError('No hay conexión. Revisá internet y probá de nuevo.');
      setBusy(false);
      return null;
    }
  }

  /** Salió "Intentá de nuevo": misma persona, otra tirada */
  function retry() {
    setShowPrize(false);
    setResult(null);
    setToken(newToken());
    setSpinError('');
    setRetryKey((k) => k + 1);
  }

  /** Listo para el siguiente participante */
  function reset() {
    setStep('form');
    setValues(null);
    setPerson(null);
    setToken('');
    setDuplicate(null);
    setSpinError('');
    setBusy(false);
    setResult(null);
    setShowPrize(false);
    setFormKey((k) => k + 1);
  }

  return (
    <div className="app-shell">
      <header className={`app-header${step === 'wheel' ? ' app-header--compact' : ''}`}>
        <BrandLogo />
        <Banner text={config.texts.banner} />
      </header>

      <main className="app-main">
        {step === 'form' ? (
          <RegistrationForm
            key={formKey}
            texts={config.texts}
            initial={values ?? undefined}
            serverError={duplicate}
            onReady={handleReady}
          />
        ) : (
          <section className="wheel-screen rise-in">
            <h1 className="headline-sm">{fillName(config.texts.greeting, person?.nombre ?? '')}</h1>
            <p className="screen-sub">{config.texts.spinHint}</p>

            <Wheel onSpin={handleSpin} onStop={() => setShowPrize(true)} resetKey={retryKey} />

            {spinError && (
              <p role="alert" className="dm-notice" style={{ marginTop: 24 }}>
                {spinError}
              </p>
            )}

            {!busy && (
              <button type="button" className="link-btn" onClick={() => setStep('form')}>
                Editar mis datos
              </button>
            )}
          </section>
        )}
      </main>

      {showPrize && result && person && (
        <PrizeModal
          name={person.nombre}
          type={result.type}
          prize={result.prize}
          texts={config.texts}
          onClose={reset}
          onRetry={retry}
        />
      )}
    </div>
  );
}
