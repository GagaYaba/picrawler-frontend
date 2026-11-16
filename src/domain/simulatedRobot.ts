/**
 * Simulateur du PiCrawler pour la console. Il reprend les règles du backend
 * (vitesse 20 à 70 refusée hors plage, une commande à la fois, 0,25 s entre deux
 * actions, arrêt d'urgence) mais ne prouve rien du comportement du robot réel.
 */

export const MIN_SPEED = 20;
export const MAX_SPEED = 70;
export const MIN_INTERVAL_MS = 250;
/** Mesure du 7 novembre 2026 : environ 34 cm pour 5 pas. */
export const STEP_LENGTH_CM = 6.8;
/** Non mesuré : valeur provisoire [À MESURER]. */
export const TURN_ANGLE_DEG = 15;

export type Posture = 'sitting' | 'standing' | 'moving';

export type Command =
  | { type: 'stand'; speed: number }
  | { type: 'sit'; speed: number }
  /** Salut d'une patte : présent dans la maquette, absent du backend [À RÉALISER côté backend]. */
  | { type: 'wave'; speed: number }
  | { type: 'walk'; direction: 'forward' | 'backward'; steps: number; speed: number }
  | { type: 'turn'; direction: 'left' | 'right'; steps: number; speed: number };

export type RefusalReason = 'emergency-stop' | 'speed-out-of-range' | 'busy' | 'invalid-steps';

export type Result = { ok: true } | { ok: false; reason: RefusalReason };

/** Mouvement en cours : sens +1 (avant, gauche) ou -1 (arrière, droite). */
export type Motion = { kind: 'stand' | 'sit' | 'wave' | 'walk' | 'turn'; sign: 1 | -1 };

export type Snapshot = {
  posture: Posture;
  motion: Motion | null;
  emergencyStopped: boolean;
  /** Position en centimètres ; cap en degrés, 0 le long de x, positif vers la gauche. */
  xCm: number;
  yCm: number;
  headingDeg: number;
};

/** Déplacement total d'une commande, réparti linéairement sur sa durée. */
type Delta = { xCm: number; yCm: number; headingDeg: number };

type Pending = {
  start: number;
  until: number;
  finalPosture: 'sitting' | 'standing';
  motion: Motion;
  delta: Delta;
};

export class SimulatedRobot {
  private posture: 'sitting' | 'standing' = 'sitting';
  private emergencyStopped = false;
  private xCm = 0;
  private yCm = 0;
  private headingDeg = 0;
  private pending: Pending | null = null;
  private freeAt = 0;

  /** Durée d'un pas en millisecondes : plus la vitesse est haute, plus c'est court. */
  static stepDurationMs(speed: number): number {
    return 16000 / speed;
  }

  command(cmd: Command, now: number): Result {
    this.settle(now);
    if (this.emergencyStopped) return { ok: false, reason: 'emergency-stop' };
    if (!(cmd.speed >= MIN_SPEED && cmd.speed <= MAX_SPEED)) {
      return { ok: false, reason: 'speed-out-of-range' };
    }
    const steps =
      cmd.type === 'walk' || cmd.type === 'turn' ? cmd.steps : cmd.type === 'wave' ? 4 : 1;
    if (!Number.isInteger(steps) || steps < 1) return { ok: false, reason: 'invalid-steps' };
    if (this.pending || now < this.freeAt) return { ok: false, reason: 'busy' };

    const duration = steps * SimulatedRobot.stepDurationMs(cmd.speed);
    const delta: Delta = { xCm: 0, yCm: 0, headingDeg: 0 };
    let finalPosture: 'sitting' | 'standing' = 'standing';
    if (cmd.type === 'sit') finalPosture = 'sitting';
    if (cmd.type === 'walk') {
      const sign = cmd.direction === 'forward' ? 1 : -1;
      const heading = (this.headingDeg * Math.PI) / 180;
      const distance = sign * steps * STEP_LENGTH_CM;
      delta.xCm = distance * Math.cos(heading);
      delta.yCm = distance * Math.sin(heading);
    }
    if (cmd.type === 'turn') {
      const sign = cmd.direction === 'left' ? 1 : -1;
      delta.headingDeg = sign * steps * TURN_ANGLE_DEG;
    }
    const sign: 1 | -1 =
      (cmd.type === 'walk' && cmd.direction === 'backward') ||
      (cmd.type === 'turn' && cmd.direction === 'right')
        ? -1
        : 1;
    this.pending = {
      start: now,
      until: now + duration,
      finalPosture,
      motion: { kind: cmd.type, sign },
      delta,
    };
    return { ok: true };
  }

  /**
   * Arrêt immédiat : le mouvement en cours est interrompu là où il en est
   * et le robot simulé s'assoit.
   */
  emergencyStop(now?: number): void {
    if (this.pending && now !== undefined) this.commit(this.progress(now));
    this.emergencyStopped = true;
    this.pending = null;
    this.posture = 'sitting';
    this.freeAt = 0;
  }

  resetEmergencyStop(): void {
    this.emergencyStopped = false;
  }

  snapshot(now: number): Snapshot {
    this.settle(now);
    return {
      posture: this.pending ? 'moving' : this.posture,
      motion: this.pending ? this.pending.motion : null,
      emergencyStopped: this.emergencyStopped,
      ...this.poseAt(this.pending ? this.progress(now) : 0),
    };
  }

  /** Avancement du mouvement en cours, de 0 à 1. */
  private progress(now: number): number {
    const p = this.pending;
    if (!p || p.until <= p.start) return 1;
    return Math.max(0, Math.min(1, (now - p.start) / (p.until - p.start)));
  }

  /** Pose au fil du mouvement : la marche et la rotation progressent pendant toute la commande. */
  private poseAt(frac: number): Pick<Snapshot, 'xCm' | 'yCm' | 'headingDeg'> {
    const d = this.pending?.delta ?? { xCm: 0, yCm: 0, headingDeg: 0 };
    return {
      xCm: this.xCm + d.xCm * frac,
      yCm: this.yCm + d.yCm * frac,
      headingDeg: (((this.headingDeg + d.headingDeg * frac) % 360) + 360) % 360,
    };
  }

  private commit(frac: number): void {
    const pose = this.poseAt(frac);
    this.xCm = pose.xCm;
    this.yCm = pose.yCm;
    this.headingDeg = pose.headingDeg;
  }

  private settle(now: number): void {
    if (this.pending && now >= this.pending.until) {
      this.commit(1);
      this.posture = this.pending.finalPosture;
      this.freeAt = this.pending.until + MIN_INTERVAL_MS;
      this.pending = null;
    }
  }
}
