import { alertsFor, commandGate, LIMITS, type Telemetry } from './realRobotDemo';

const ok: Telemetry = { latencyMs: 14, batteryV: 7.99, tempC: 48, obstacleCm: 62 };

describe('alerts', () => {
  it('raises a critical alert when the heartbeat is lost', () => {
    const a = alertsFor(ok, 'link', 'on');
    expect(a).toHaveLength(1);
    expect(a[0].level).toBe('crit');
    expect(a[0].text).toContain(`${LIMITS.heartbeatS} s`);
  });
  it('flags each provisional threshold', () => {
    expect(alertsFor(ok, 'bat', 'on')[0].title).toBe('Batterie basse');
    expect(alertsFor(ok, 'temp', 'on')[0].title).toBe('Température élevée');
    expect(alertsFor(ok, 'obst', 'on')[0].title).toBe('Obstacle proche');
  });
  it('ignores the obstacle when the camera feed is not connected', () => {
    expect(alertsFor(ok, 'obst', 'off')).toEqual([]);
  });
});

describe('command gate', () => {
  const base = { session: true, feed: 'on' as const, estop: false, link: true };
  it('opens only when every condition holds', () => {
    expect(commandGate(base)).toEqual({ open: true, label: 'Actives' });
    expect(commandGate({ ...base, session: false }).open).toBe(false);
    expect(commandGate({ ...base, feed: 'loading' }).open).toBe(false);
    expect(commandGate({ ...base, link: false }).open).toBe(false);
  });
  it('gives priority to the emergency stop', () => {
    expect(commandGate({ ...base, estop: true, link: false }).label).toBe('Arrêt actif');
  });
});
