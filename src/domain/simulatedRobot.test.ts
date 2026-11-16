import {
  MAX_SPEED,
  MIN_SPEED,
  SimulatedRobot,
  STEP_LENGTH_CM,
  TURN_ANGLE_DEG,
  type Command,
} from './simulatedRobot';

const walk = (speed = 40, steps = 1): Command => ({
  type: 'walk',
  direction: 'forward',
  steps,
  speed,
});
/** Laisse passer la durée de la commande et le délai de 0,25 s. */
const LATER = 10_000;

describe('safety limits', () => {
  it.each([MIN_SPEED - 1, MAX_SPEED + 1, 0, 100, NaN])(
    'refuses speed %s without moving',
    (speed) => {
      const robot = new SimulatedRobot();
      expect(robot.command(walk(speed), 0)).toEqual({ ok: false, reason: 'speed-out-of-range' });
      expect(robot.snapshot(LATER)).toMatchObject({ posture: 'sitting', xCm: 0 });
    },
  );

  it.each([MIN_SPEED, MAX_SPEED])('accepts the limit speed %s', (speed) => {
    expect(new SimulatedRobot().command(walk(speed), 0)).toEqual({ ok: true });
  });

  it('accepts only one command at a time, then waits 0.25 s after the end', () => {
    const robot = new SimulatedRobot();
    const duration = SimulatedRobot.stepDurationMs(40);
    expect(robot.command(walk(40), 0)).toEqual({ ok: true });
    expect(robot.command(walk(40), duration / 2)).toEqual({ ok: false, reason: 'busy' });
    expect(robot.command(walk(40), duration + 100)).toEqual({ ok: false, reason: 'busy' });
    expect(robot.command(walk(40), duration + 250)).toEqual({ ok: true });
  });
});

describe('emergency stop', () => {
  it('cancels the movement in progress, sits the robot and refuses new commands', () => {
    const robot = new SimulatedRobot();
    robot.command({ type: 'stand', speed: 40 }, 0);
    robot.command(walk(), LATER);
    robot.emergencyStop();
    expect(robot.snapshot(LATER * 2)).toMatchObject({ posture: 'sitting', xCm: 0 });
    expect(robot.command(walk(), LATER * 2)).toEqual({ ok: false, reason: 'emergency-stop' });
  });

  it('accepts commands again after a reset', () => {
    const robot = new SimulatedRobot();
    robot.emergencyStop();
    robot.resetEmergencyStop();
    expect(robot.command({ type: 'stand', speed: 40 }, 0)).toEqual({ ok: true });
  });
});

describe('pose', () => {
  it('moves along the heading and turns by the configured angle per step', () => {
    const robot = new SimulatedRobot();
    robot.command({ type: 'turn', direction: 'left', steps: 6, speed: 40 }, 0);
    robot.command(walk(40, 5), LATER);
    const s = robot.snapshot(LATER * 2);
    expect(s.headingDeg).toBe(6 * TURN_ANGLE_DEG);
    expect(Math.hypot(s.xCm, s.yCm)).toBeCloseTo(5 * STEP_LENGTH_CM);
    expect(s.yCm).toBeGreaterThan(0);
  });

  it('turns and walks progressively during the command, not only at its end', () => {
    const robot = new SimulatedRobot();
    const turnMs = 4 * SimulatedRobot.stepDurationMs(40);
    robot.command({ type: 'turn', direction: 'right', steps: 4, speed: 40 }, 0);
    expect(robot.snapshot(turnMs / 4).headingDeg).toBeCloseTo(360 - TURN_ANGLE_DEG);
    expect(robot.snapshot(turnMs / 2).headingDeg).toBeCloseTo(360 - 2 * TURN_ANGLE_DEG);

    const fresh = new SimulatedRobot();
    const walkMs = 4 * SimulatedRobot.stepDurationMs(40);
    fresh.command(walk(40, 4), 0);
    expect(fresh.snapshot(walkMs / 2).xCm).toBeCloseTo(2 * STEP_LENGTH_CM);
  });

  it('keeps the pose reached when the emergency stop interrupts a movement', () => {
    const robot = new SimulatedRobot();
    const walkMs = 4 * SimulatedRobot.stepDurationMs(40);
    robot.command(walk(40, 4), 0);
    robot.emergencyStop(walkMs / 4);
    expect(robot.snapshot(LATER)).toMatchObject({ posture: 'sitting', motion: null });
    expect(robot.snapshot(LATER).xCm).toBeCloseTo(STEP_LENGTH_CM);
  });

  it('reports moving while a command runs, then the final posture', () => {
    const robot = new SimulatedRobot();
    robot.command({ type: 'stand', speed: 40 }, 0);
    expect(robot.snapshot(10).posture).toBe('moving');
    expect(robot.snapshot(LATER).posture).toBe('standing');
  });
});
