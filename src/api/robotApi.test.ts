import { describe, expect, it, vi } from 'vitest';
import { ApiError, createRobotApi } from './robotApi';

const reply = (status: number, body?: unknown) =>
  vi.fn(async () => new Response(body === undefined ? null : JSON.stringify(body), { status }));

describe('robotApi', () => {
  it('envoie le jeton et la commande de marche', async () => {
    const f = reply(204);
    await createRobotApi('http://robot/', 'jeton', f as unknown as typeof fetch).walk(
      'forward',
      2,
      40,
    );
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('http://robot/commands/walk');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer jeton');
    expect(JSON.parse(init.body as string)).toEqual({ direction: 'forward', steps: 2, speed: 40 });
  });

  it("classe les refus du backend : jeton, arrêt d'urgence, limite de sécurité", async () => {
    for (const [code, kind] of [
      [401, 'auth'],
      [409, 'estop'],
      [422, 'safety'],
    ] as const) {
      const api = createRobotApi(
        'http://r',
        'j',
        reply(code, { detail: 'x' }) as unknown as typeof fetch,
      );
      await expect(api.sit(40)).rejects.toMatchObject({ kind, message: 'x' });
    }
  });

  it('signale un robot injoignable', async () => {
    const f = vi.fn(async () => {
      throw new TypeError('fail');
    });
    const err = await createRobotApi('http://r', 'j', f as unknown as typeof fetch)
      .heartbeat()
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).kind).toBe('network');
  });
});
