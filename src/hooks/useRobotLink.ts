import { useEffect, useState } from 'react';
import { ApiError, type ApiTelemetry, type RobotApi } from '../api/robotApi';
import { LIMITS } from '../domain/realRobotDemo';

export const HEARTBEAT_PERIOD_MS = 500;
const TELEMETRY_PERIOD_MS = 1000;

export type RobotLink = {
  /** Pulsation reçue dans le délai : sinon le backend assoit le robot de lui-même. */
  link: boolean;
  /** Durée du dernier aller-retour de la pulsation. */
  latencyMs: number | null;
  telemetry: ApiTelemetry | null;
};

/** Pulsation toutes les 0,5 s et télémétrie toutes les secondes, tant qu'une session est ouverte. */
export function useRobotLink(api: RobotApi | null): RobotLink {
  const [state, setState] = useState<RobotLink>({ link: true, latencyMs: null, telemetry: null });

  useEffect(() => {
    if (!api) return;
    let lastOk = performance.now();
    let alive = true;
    const beat = async () => {
      const t0 = performance.now();
      try {
        await api.heartbeat();
        lastOk = performance.now();
        if (alive) setState((s) => ({ ...s, link: true, latencyMs: Math.round(lastOk - t0) }));
      } catch (e) {
        const lost = performance.now() - lastOk > LIMITS.heartbeatS * 1000;
        if (alive && (lost || (e instanceof ApiError && e.kind === 'auth'))) {
          setState((s) => ({ ...s, link: false, latencyMs: null }));
        }
      }
    };
    const poll = async () => {
      try {
        const telemetry = await api.telemetry();
        if (alive) setState((s) => ({ ...s, telemetry }));
      } catch {
        /* la pulsation signale la perte de liaison */
      }
    };
    void beat();
    void poll();
    const a = setInterval(() => void beat(), HEARTBEAT_PERIOD_MS);
    const b = setInterval(() => void poll(), TELEMETRY_PERIOD_MS);
    return () => {
      alive = false;
      clearInterval(a);
      clearInterval(b);
    };
  }, [api]);

  return api ? state : { link: true, latencyMs: null, telemetry: null };
}
