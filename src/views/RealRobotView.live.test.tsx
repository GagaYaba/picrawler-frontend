import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { App } from '../App';

const TOKEN = 'a'.repeat(32);
const telemetry = {
  posture: 'sitting',
  connected: true,
  emergency_stopped: false,
  battery_voltage: 7.8,
  cpu_temperature_celsius: null,
};

/** Backend simulé : réponses fabriquées, aucun robot. */
function stubBackend(accepted = TOKEN) {
  const calls: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit) => {
      const auth = (init.headers as Record<string, string>).Authorization;
      const path = new URL(url).pathname;
      calls.push(`${init.method} ${path}`);
      if (auth !== `Bearer ${accepted}`) {
        return new Response(JSON.stringify({ detail: 'invalid or missing token' }), {
          status: 401,
        });
      }
      return path === '/telemetry'
        ? new Response(JSON.stringify(telemetry), { status: 200 })
        : new Response(null, { status: 204 });
    }),
  );
  return calls;
}

beforeEach(() => {
  window.location.hash = '#robot';
  import.meta.env.VITE_API_URL = 'http://robot.test';
});
afterEach(() => {
  vi.unstubAllGlobals();
  delete import.meta.env.VITE_API_URL;
});

const pad = () => screen.getByRole('group', { name: 'Marche du robot réel' });
const open = async (user: ReturnType<typeof userEvent.setup>, token = TOKEN) => {
  await user.type(screen.getByLabelText('Jeton opérateur'), token);
  await user.click(screen.getByRole('button', { name: 'Ouvrir la session' }));
};

describe('Robot réel screen, connected to the backend', () => {
  it('refuses a token rejected by the backend', async () => {
    stubBackend('b'.repeat(32));
    const user = userEvent.setup();
    render(<App />);
    await open(user);
    expect(await screen.findByText('Jeton refusé par le robot.')).toBeInTheDocument();
    expect(within(pad()).getByRole('button', { name: 'Avancer' })).toBeDisabled();
  });

  it('opens the session, sends a command and shows the measures', async () => {
    const calls = stubBackend();
    const user = userEvent.setup();
    render(<App />);
    await open(user);
    await waitFor(() =>
      expect(within(pad()).getByRole('button', { name: 'Avancer' })).toBeEnabled(),
    );
    expect(await screen.findByText('7,80')).toBeInTheDocument();
    expect(screen.getByText(/Backend connecté · robot simulé/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Debout' }));
    expect(calls).toContain('POST /commands/stand');
    expect(calls).toContain('POST /heartbeat');
  });

  it('transmits the emergency stop to the backend', async () => {
    const calls = stubBackend();
    const user = userEvent.setup();
    render(<App />);
    await open(user);
    await waitFor(() =>
      expect(within(pad()).getByRole('button', { name: 'Avancer' })).toBeEnabled(),
    );
    await user.keyboard('{Escape}');
    await waitFor(() => expect(calls).toContain('POST /emergency-stop'));
    expect(within(pad()).getByRole('button', { name: 'Avancer' })).toBeDisabled();
  });
});
