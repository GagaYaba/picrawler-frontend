import { useCallback, useEffect, useRef, useState } from 'react';
import type { Snapshot } from '../domain/simulatedRobot';
import type { RobotScene } from './robotScene';

const STANDING: Snapshot = {
  posture: 'standing',
  motion: null,
  emergencyStopped: false,
  xCm: 0,
  yCm: 0,
  headingDeg: 0,
};

const LEGS = [
  [1, 'Patte 1 · avant droite'],
  [2, 'Patte 2 · avant gauche'],
  [3, 'Patte 3 · arrière gauche'],
  [4, 'Patte 4 · arrière droite'],
] as const;

type Props = { fallback: React.ReactNode };

/**
 * Câblage sur le modèle 3D : le robot debout, vu de dessus depuis l'arrière (avant en haut), avec
 * le port de chaque servo sur sa patte. Une patte peut être mise en avant. Si le modèle ou WebGL
 * est indisponible, le schéma à plat prend le relais.
 */
export function WiringScene({ fallback }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [scene, setScene] = useState<RobotScene | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [leg, setLeg] = useState<number | null>(null);

  useEffect(() => {
    let disposed = false;
    let created: RobotScene | null = null;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    import('./robotScene')
      .then(({ createRobotScene }) =>
        createRobotScene(
          canvas.current!,
          import.meta.env.VITE_MODEL_URL ?? `${import.meta.env.BASE_URL}models/picrawler_rig.glb`,
          reduced,
          () => {},
          { wiring: true },
        ),
      )
      .then((s) => {
        if (disposed) return s.dispose();
        created = s;
        s.setState(STANDING);
        setScene(s);
      })
      .catch((e) => {
        console.warn('Modèle 3D indisponible pour le câblage', e);
        if (!disposed) setFailed(true);
      })
      .finally(() => !disposed && setLoading(false));
    return () => {
      disposed = true;
      created?.dispose();
    };
  }, []);

  useEffect(() => scene?.highlight(leg), [scene, leg]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const step: Record<string, [number, number]> = {
        ArrowLeft: [-0.15, 0],
        ArrowRight: [0.15, 0],
        ArrowUp: [0, 0.1],
        ArrowDown: [0, -0.1],
      };
      const d = step[e.key];
      if (d) {
        e.preventDefault();
        scene?.rotate(d[0], d[1]);
      }
    },
    [scene],
  );

  if (failed) return <>{fallback}</>;

  return (
    <div>
      <div className="seg wlegs" role="group" aria-label="Patte à mettre en avant">
        <button type="button" aria-pressed={leg === null} onClick={() => setLeg(null)}>
          Toutes
        </button>
        {LEGS.map(([k, label]) => (
          <button key={k} type="button" aria-pressed={leg === k} onClick={() => setLeg(k)}>
            {label}
          </button>
        ))}
      </div>
      <div className="stage wstage">
        <canvas
          ref={canvas}
          tabIndex={0}
          role="img"
          aria-label="Modèle 3D du robot vu de dessus, avant en haut, avec le port de chaque servo sur sa patte. Faire glisser ou utiliser les flèches du clavier pour tourner autour. Le tableau à côté donne les mêmes ports."
          onKeyDown={onKeyDown}
        />
        {loading && <p className="note stage-msg">Chargement du modèle 3D…</p>}
      </div>
    </div>
  );
}
