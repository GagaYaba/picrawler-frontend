import type { Snapshot } from '../domain/simulatedRobot';

/** Angle commandé d'un servo, pour le panneau « Servos ». */
export type ServoAngle = { port: number; leg: number; deg: number };

/** Ports du Robot HAT par patte (section Montage) : patte 1 P9-P11, 2 P3-P5, 3 P0-P2, 4 P6-P8. */
export const PORTS: Record<number, [number, number, number]> = {
  1: [9, 10, 11],
  2: [3, 4, 5],
  3: [0, 1, 2],
  4: [6, 7, 8],
};

const STATUS: Record<string, string> = {
  stand: 'debout',
  sit: 'assis',
  wave: 'salut',
  'walk+1': 'marche avant',
  'walk-1': 'marche arrière',
  'turn+1': 'rotation gauche',
  'turn-1': 'rotation droite',
};

/** Libellé de l'état, comme dans la maquette. */
export function statusLabel(s: Snapshot): string {
  if (s.emergencyStopped) return "arrêt d'urgence";
  if (s.motion) {
    const k =
      s.motion.kind === 'walk' || s.motion.kind === 'turn'
        ? `${s.motion.kind}${s.motion.sign > 0 ? '+1' : '-1'}`
        : s.motion.kind;
    return STATUS[k];
  }
  return s.posture === 'standing' ? 'debout' : 'assis';
}
