import { SLICES } from './config';

/** Medidas del dibujo (viewBox 500 x 500) */
export const CX = 250;
export const CY = 250;
export const R_OUT = 246; // aro exterior
export const R_SLICE = 222; // borde de los gajos
export const R_LIGHTS = 234; // lucecitas del aro
export const R_TEXT = 152; // centro del texto de cada gajo
export const R_HUB = 76; // círculo del centro

export const SEG = 360 / SLICES.length; // ancho de cada gajo, en grados
export const SPIN_MS = 5500; // duración del giro

/** Punto del círculo. deg = ángulo desde arriba, en sentido horario */
export function polar(r: number, deg: number): { x: number; y: number } {
  const a = (deg * Math.PI) / 180;
  return { x: CX + r * Math.sin(a), y: CY - r * Math.cos(a) };
}

/** Forma del gajo i (el 0 arranca arriba y van en sentido horario) */
export function slicePath(i: number): string {
  const a = polar(R_SLICE, i * SEG);
  const b = polar(R_SLICE, (i + 1) * SEG);
  return `M ${CX} ${CY} L ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${R_SLICE} ${R_SLICE} 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)} Z`;
}

/**
 * Rotación final (en grados, siempre creciente) para que el gajo `index`
 * quede bajo la flecha. El resultado ya viene decidido por el servidor:
 * esto solo arma la animación. El punto exacto donde frena varía dentro del
 * gajo (sin tocar los bordes) y las vueltas también.
 */
export function targetRotation(current: number, index: number, rnd: () => number = Math.random): number {
  const jitter = (rnd() - 0.5) * SEG * 0.7;
  const pointAngle = index * SEG + SEG / 2 + jitter; // punto elegido dentro del gajo
  const wanted = (360 - pointAngle) % 360; // rotación (módulo 360) que lo deja arriba
  const now = ((current % 360) + 360) % 360;
  const delta = (wanted - now + 360) % 360;
  const turns = 5 + Math.floor(rnd() * 2);
  return current + turns * 360 + delta;
}

/** Qué gajo queda bajo la flecha con una rotación dada (para verificar) */
export function sliceAtPointer(rotation: number): number {
  const angle = (((360 - (rotation % 360)) % 360) + 360) % 360;
  return Math.floor(angle / SEG) % SLICES.length;
}
