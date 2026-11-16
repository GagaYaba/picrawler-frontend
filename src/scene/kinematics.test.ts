import { CM_PER_UNIT, footPosition, legIk, toWorld } from './kinematics';

describe('leg kinematics', () => {
  it('places the foot on the requested point when it is reachable', () => {
    const [l1, l2] = [0.45, 0.72];
    for (const [r, h] of [
      [0.55, -0.5],
      [0.86 - 0.13, -0.5],
      [0.3, -0.8],
    ]) {
      const [a, b] = legIk(r, h, l1, l2);
      const [fx, fy] = footPosition(a, b, l1, l2);
      expect(fx).toBeCloseTo(r, 5);
      expect(fy).toBeCloseTo(h, 5);
    }
  });

  it('keeps the legs finite when the target is out of reach', () => {
    const [a, b] = legIk(5, -5, 0.45, 0.72);
    expect(Number.isFinite(a) && Number.isFinite(b)).toBe(true);
  });
});

describe('simulator to scene mapping', () => {
  it('moves along x at heading 0 and turns left towards -z', () => {
    expect(toWorld(CM_PER_UNIT, 0, 0)).toMatchObject({ x: 1, z: -0 });
    const w = toWorld(0, CM_PER_UNIT, 90);
    expect(w.z).toBeCloseTo(-1);
    expect(w.rotY).toBeCloseTo(Math.PI / 2);
  });
});
