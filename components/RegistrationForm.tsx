'use client';

import { useId, useState, type FormEvent, type MouseEvent } from 'react';
import { ESPECIALIDADES, OCUPACIONES, OCUPACION_ODONTOLOGO, type Texts } from '../lib/config';
import {
  suggestEmail,
  validateParticipant,
  type CleanParticipant,
  type FieldErrors,
  type ParticipantInput,
} from '../lib/validation';
import BasesModal from './BasesModal';

interface Props {
  /** Textos editables desde /admin */
  texts: Texts;
  /** Datos ya cargados (cuando la persona vuelve a editar) */
  initial?: ParticipantInput;
  /** Error que llegó del servidor al girar (mail o celular repetido) */
  serverError?: { field: 'email' | 'celular'; message: string } | null;
  /** Se llama cuando los datos están bien y no participó antes */
  onReady: (input: ParticipantInput, clean: CleanParticipant) => void;
}

const EMPTY: ParticipantInput = {
  nombre: '',
  apellido: '',
  celular: '',
  email: '',
  ocupacion: '',
  especialidad: '',
  acepto: false,
};

export default function RegistrationForm({ texts, initial, serverError, onReady }: Props) {
  const uid = useId();
  const [values, setValues] = useState<ParticipantInput>(initial ?? EMPTY);
  const [errors, setErrors] = useState<FieldErrors>(serverError ? { [serverError.field]: serverError.message } : {});
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [emailHint, setEmailHint] = useState<string | null>(null);
  const [dismissedEmail, setDismissedEmail] = useState('');
  const [showBases, setShowBases] = useState(false);

  const id = (name: string) => `${uid}-${name}`;

  function set<K extends keyof ParticipantInput>(key: K, value: ParticipantInput[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  }

  function checkEmailHint() {
    const suggestion = suggestEmail(values.email);
    setEmailHint(suggestion && dismissedEmail !== values.email.trim().toLowerCase() ? suggestion : null);
  }

  function focusFirstError() {
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>('[aria-invalid="true"]');
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      el?.focus({ preventScroll: true });
    });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setNotice('');

    const result = validateParticipant(values);
    if (!result.ok) {
      setErrors(result.errors);
      focusFirstError();
      return;
    }
    setErrors({});

    // Mail con pinta de error de tipeo (gmial.com, hotmial.com...): se pregunta una vez antes de seguir
    const suggestion = suggestEmail(values.email);
    if (suggestion && dismissedEmail !== values.email.trim().toLowerCase()) {
      setEmailHint(suggestion);
      document.getElementById(id('email'))?.focus();
      return;
    }
    setBusy(true);

    try {
      const res = await fetch('/api/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, checkOnly: true }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 409) {
        const field = data.field === 'celular' ? 'celular' : 'email';
        setErrors({ [field]: data.error ?? 'Ya participaste.' });
        focusFirstError();
      } else if (res.status === 400 && data.errors) {
        setErrors(data.errors);
        focusFirstError();
      } else if (!res.ok) {
        setNotice(data.error ?? 'No pudimos verificar tus datos. Probá de nuevo.');
      } else {
        onReady(values, result.data);
      }
    } catch {
      setNotice('No hay conexión. Revisá internet y probá de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  const esOdontologo = values.ocupacion === OCUPACION_ODONTOLOGO;

  return (
    <div className="form-wrap">
      <h1 className="headline-sm">{texts.title}</h1>
      <p className="screen-sub">{texts.subtitle}</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="dm-label" htmlFor={id('nombre')}>
              Nombre
            </label>
            <input
              id={id('nombre')}
              className="dm-input"
              type="text"
              autoComplete="off"
              value={values.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              aria-invalid={errors.nombre ? true : undefined}
              aria-describedby={errors.nombre ? id('nombre-error') : undefined}
            />
            {errors.nombre && (
              <p id={id('nombre-error')} className="dm-error">
                {errors.nombre}
              </p>
            )}
          </div>
          <div>
            <label className="dm-label" htmlFor={id('apellido')}>
              Apellido
            </label>
            <input
              id={id('apellido')}
              className="dm-input"
              type="text"
              autoComplete="off"
              value={values.apellido}
              onChange={(e) => set('apellido', e.target.value)}
              aria-invalid={errors.apellido ? true : undefined}
              aria-describedby={errors.apellido ? id('apellido-error') : undefined}
            />
            {errors.apellido && (
              <p id={id('apellido-error')} className="dm-error">
                {errors.apellido}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="dm-label" htmlFor={id('celular')}>
            Celular
          </label>
          <input
            id={id('celular')}
            className="dm-input"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder="11 2345 6789"
            value={values.celular}
            onChange={(e) => set('celular', e.target.value)}
            aria-invalid={errors.celular ? true : undefined}
            aria-describedby={errors.celular ? id('celular-error') : undefined}
          />
          {errors.celular && (
            <p id={id('celular-error')} className="dm-error">
              {errors.celular}
            </p>
          )}
        </div>

        <div>
          <label className="dm-label" htmlFor={id('email')}>
            Mail
          </label>
          <input
            id={id('email')}
            className="dm-input"
            type="email"
            inputMode="email"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="nombre@mail.com"
            value={values.email}
            onChange={(e) => {
              set('email', e.target.value);
              setEmailHint(null);
            }}
            onBlur={checkEmailHint}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? id('email-error') : undefined}
          />
          {errors.email && (
            <p id={id('email-error')} className="dm-error">
              {errors.email}
            </p>
          )}
          {emailHint && (
            <div className="email-hint" role="alert">
              <span>
                ¿Quisiste decir <strong>{emailHint}</strong>?
              </span>
              <div className="email-hint-actions">
                <button
                  type="button"
                  onClick={() => {
                    set('email', emailHint);
                    setEmailHint(null);
                  }}
                >
                  Sí, corregir
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDismissedEmail(values.email.trim().toLowerCase());
                    setEmailHint(null);
                  }}
                >
                  No, está bien
                </button>
              </div>
            </div>
          )}
        </div>

        <fieldset>
          <legend className="dm-label">Ocupación</legend>
          <div className="dm-seg" role="radiogroup" tabIndex={-1} aria-invalid={errors.ocupacion ? true : undefined}>
            {OCUPACIONES.map((option) => (
              <label key={option}>
                <input
                  type="radio"
                  name={id('ocupacion')}
                  value={option}
                  checked={values.ocupacion === option}
                  onChange={() => {
                    set('ocupacion', option);
                    set('especialidad', '');
                  }}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
          {errors.ocupacion && <p className="dm-error">{errors.ocupacion}</p>}
        </fieldset>

        {esOdontologo && (
          <div>
            <label className="dm-label" htmlFor={id('especialidad')}>
              Especialidad
            </label>
            <select
              id={id('especialidad')}
              className="dm-input"
              value={values.especialidad}
              onChange={(e) => set('especialidad', e.target.value)}
              aria-invalid={errors.especialidad ? true : undefined}
              aria-describedby={errors.especialidad ? id('especialidad-error') : undefined}
            >
              <option value="">Elegí tu especialidad</option>
              {ESPECIALIDADES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.especialidad && (
              <p id={id('especialidad-error')} className="dm-error">
                {errors.especialidad}
              </p>
            )}
          </div>
        )}

        <div>
          <label className="dm-check">
            <input
              type="checkbox"
              checked={values.acepto}
              onChange={(e) => set('acepto', e.target.checked)}
              aria-invalid={errors.acepto ? true : undefined}
            />
            <span>
              <ConsentText text={texts.consent} onOpen={() => setShowBases(true)} />
            </span>
          </label>
          {errors.acepto && <p className="dm-error">{errors.acepto}</p>}
        </div>

        {notice && (
          <p role="alert" className="dm-notice">
            {notice}
          </p>
        )}

        <button type="submit" className="dm-btn" disabled={busy}>
          {busy ? 'Verificando…' : texts.submit}
        </button>
      </form>
      {showBases && <BasesModal text={texts.bases} onClose={() => setShowBases(false)} />}
    </div>
  );
}

/** El texto del checkbox, con "bases y condiciones" como link que abre el pop-up de las bases */
function ConsentText({ text, onOpen }: { text: string; onOpen: () => void }) {
  const open = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onOpen();
  };
  const match = /bases y condiciones/i.exec(text);
  if (!match) {
    return (
      <>
        {text}{' '}
        <button type="button" className="consent-link" onClick={open}>
          Ver bases y condiciones
        </button>
      </>
    );
  }
  return (
    <>
      {text.slice(0, match.index)}
      <button type="button" className="consent-link" onClick={open}>
        {match[0]}
      </button>
      {text.slice(match.index + match[0].length)}
    </>
  );
}
