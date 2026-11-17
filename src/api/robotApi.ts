/** Client de l'API de contrôle (backend). Aucune donnée n'est conservée ici, le jeton reste en mémoire. */

export type Posture = 'sitting' | 'standing' | 'moving';

export type ApiTelemetry = {
  posture: Posture;
  connected: boolean;
  emergency_stopped: boolean;
  battery_voltage: number | null;
  cpu_temperature_celsius: number | null;
};

export type ApiErrorKind = 'auth' | 'safety' | 'estop' | 'network' | 'server';

export class ApiError extends Error {
  constructor(
    readonly kind: ApiErrorKind,
    message: string,
  ) {
    super(message);
  }
}

const KIND: Record<number, ApiErrorKind> = { 401: 'auth', 409: 'estop', 422: 'safety' };

export type RobotApi = ReturnType<typeof createRobotApi>;

export function createRobotApi(baseUrl: string, token: string, fetcher: typeof fetch = fetch) {
  const root = baseUrl.replace(/\/+$/, '');

  async function call<T = void>(path: string, body?: unknown): Promise<T> {
    let res: Response;
    try {
      res = await fetcher(`${root}${path}`, {
        method: body === undefined && path === '/telemetry' ? 'GET' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new ApiError('network', 'Robot injoignable');
    }
    if (!res.ok) {
      let detail = '';
      try {
        const data = (await res.json()) as { detail?: unknown };
        if (typeof data.detail === 'string') detail = data.detail;
      } catch {
        /* corps absent ou non JSON */
      }
      throw new ApiError(KIND[res.status] ?? 'server', detail || `Erreur ${res.status}`);
    }
    return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
  }

  return {
    telemetry: () => call<ApiTelemetry>('/telemetry'),
    heartbeat: () => call('/heartbeat'),
    stand: (speed: number) => call('/commands/stand', { speed }),
    sit: (speed: number) => call('/commands/sit', { speed }),
    walk: (direction: 'forward' | 'backward', steps: number, speed: number) =>
      call('/commands/walk', { direction, steps, speed }),
    turn: (direction: 'left' | 'right', steps: number, speed: number) =>
      call('/commands/turn', { direction, steps, speed }),
    emergencyStop: () => call('/emergency-stop'),
    resetEmergencyStop: () => call('/emergency-stop/reset'),
  };
}
