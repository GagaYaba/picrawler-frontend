/** Une unité de la scène 3D correspond à 25 cm (le robot mesure environ 22 cm). */
export const CM_PER_UNIT = 25;

/** Position du robot dans la scène : x vers l'avant à cap 0, y du plan vers -z, cap positif vers la gauche. */
export function toWorld(xCm: number, yCm: number, headingDeg: number) {
  return { x: xCm / CM_PER_UNIT, z: -yCm / CM_PER_UNIT, rotY: (headingDeg * Math.PI) / 180 };
}

/**
 * Cinématique inverse d'une patte à deux segments L1 (fémur) et L2 (tibia) dans son plan.
 * `r` est la distance horizontale, `h` la hauteur du pied sous la hanche (négative vers le bas).
 * Renvoie les angles du fémur et du tibia, la cible étant ramenée à la portée maximale.
 */
export function legIk(r: number, h: number, l1: number, l2: number): [number, number] {
  const d = Math.min(Math.hypot(r, h), l1 + l2 - 0.001);
  const a = Math.atan2(h, r) + Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d));
  const b = -(Math.PI - Math.acos((l1 * l1 + l2 * l2 - d * d) / (2 * l1 * l2)));
  return [a, b];
}

/** Position du pied obtenue avec les angles de `legIk` (contrôle de la cinématique). */
export function footPosition(a: number, b: number, l1: number, l2: number): [number, number] {
  return [l1 * Math.cos(a) + l2 * Math.cos(a + b), l1 * Math.sin(a) + l2 * Math.sin(a + b)];
}
