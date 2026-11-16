import { useEffect, useRef, useState } from 'react';
import type { Snapshot } from '../domain/simulatedRobot';
import type { RobotScene, ServoAngle } from './robotScene';

type Props = {
  snapshot: Snapshot;
  onUnavailable: () => void;
  onServos: (angles: ServoAngle[]) => void;
};

/** Scène 3D chargée à la demande, pour ne pas alourdir le premier affichage. */
export function SceneView({ snapshot, onUnavailable, onServos }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [scene, setScene] = useState<RobotScene | null>(null);
  const [loading, setLoading] = useState(true);

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
          onServos,
        ),
      )
      .then((s) => {
        if (disposed) return s.dispose();
        created = s;
        setScene(s);
      })
      .catch((e) => {
        console.warn('Modèle 3D indisponible', e);
        if (!disposed) onUnavailable();
      })
      .finally(() => !disposed && setLoading(false));
    return () => {
      disposed = true;
      created?.dispose();
    };
  }, [onUnavailable, onServos]);

  useEffect(() => scene?.setState(snapshot), [scene, snapshot]);

  const onKeyDown = (e: React.KeyboardEvent) => {
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
  };

  return (
    <>
      <canvas
        ref={canvas}
        tabIndex={0}
        role="img"
        aria-label="Modèle 3D du robot simulé, faire glisser ou utiliser les flèches du clavier pour tourner autour"
        onKeyDown={onKeyDown}
      />
      {loading && <p className="note stage-msg">Chargement du modèle 3D…</p>}
    </>
  );
}
