/** Seuils d'alerte provisoires, confirmés par la candidate le 16 novembre 2026 [À CONFIRMER]. */
export const LIMITS = { batteryMinV: 7.2, tempMaxC: 65, obstacleMinCm: 20, heartbeatS: 2 };

export const TOKEN_MIN_LENGTH = 32;

export type FeedState = 'on' | 'loading' | 'off';
export type DemoAlert = 'none' | 'bat' | 'obst' | 'temp' | 'link';

export type Telemetry = { latencyMs: number; batteryV: number; tempC: number; obstacleCm: number };

export type Alert = { level: 'crit' | 'warn'; title: string; text: string };

const fv = (v: number, d: number) => v.toFixed(d).replace('.', ',');

/** Applique l'état de démonstration choisi aux mesures simulées. */
export function effective(t: Telemetry, alert: DemoAlert) {
  return {
    batteryV: alert === 'bat' ? 6.9 : t.batteryV,
    obstacleCm: alert === 'obst' ? 15 : t.obstacleCm,
    tempC: alert === 'temp' ? 68 : t.tempC,
    link: alert !== 'link',
  };
}

export function alertsFor(t: Telemetry, alert: DemoAlert, feed: FeedState): Alert[] {
  const e = effective(t, alert);
  const out: Alert[] = [];
  if (!e.link) {
    out.push({
      level: 'crit',
      title: 'Liaison perdue',
      text: `Aucune pulsation reçue depuis plus de ${LIMITS.heartbeatS} s : le robot s'est assis seul. Les commandes sont suspendues jusqu'au retour de la liaison.`,
    });
  }
  if (e.batteryV < LIMITS.batteryMinV) {
    out.push({
      level: 'warn',
      title: 'Batterie basse',
      text: `Tension ${fv(e.batteryV, 2)} V, sous le seuil provisoire de ${fv(LIMITS.batteryMinV, 1)} V. Poser le robot et le recharger.`,
    });
  }
  if (e.tempC >= LIMITS.tempMaxC) {
    out.push({
      level: 'warn',
      title: 'Température élevée',
      text: `${fv(e.tempC, 1)} °C, au-dessus du seuil provisoire de ${LIMITS.tempMaxC} °C. Laisser refroidir.`,
    });
  }
  if (feed === 'on' && e.obstacleCm < LIMITS.obstacleMinCm) {
    out.push({
      level: 'warn',
      title: 'Obstacle proche',
      text: `${e.obstacleCm} cm, sous le seuil provisoire de ${LIMITS.obstacleMinCm} cm. Ne pas avancer.`,
    });
  }
  return out;
}

/** Les commandes ne partent que session ouverte, flux connecté, liaison présente et sans arrêt d'urgence. */
export function commandGate(o: {
  session: boolean;
  feed: FeedState;
  estop: boolean;
  link: boolean;
}): { open: boolean; label: string } {
  if (o.estop) return { open: false, label: 'Arrêt actif' };
  if (!o.link) return { open: false, label: 'Liaison perdue' };
  if (!o.session) return { open: false, label: 'Session requise' };
  if (o.feed !== 'on') return { open: false, label: 'Flux requis' };
  return { open: true, label: 'Actives' };
}
