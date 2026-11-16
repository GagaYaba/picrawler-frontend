import { useCallback, useEffect, useState } from 'react';
import { MAX_SPEED, MIN_SPEED, type Command } from '../domain/simulatedRobot';
import { type Simulation } from '../hooks/useSimulation';
import { SceneView } from '../scene/SceneView';
import { statusLabel, type ServoAngle } from '../scene/status';

/** Pas envoyés par appui : 4 pas durent 1,6 s à la vitesse 40, comme la maquette [À CONFIRMER sur le robot]. */
export const STEPS_PER_PRESS = 4;
/** Demi-largeur de la vue du dessus de repli, en centimètres. */
const HALF_SIDE_CM = 100;

const fv = (v: number, d: number) => v.toFixed(d).replace('.', ',');
const capitalize = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

type Props = { sim: Simulation };

function TopView({ xCm, yCm, headingDeg }: { xCm: number; yCm: number; headingDeg: number }) {
  const clamp = (v: number) => Math.max(-HALF_SIDE_CM, Math.min(HALF_SIDE_CM, v));
  const lines = [-80, -60, -40, -20, 0, 20, 40, 60, 80];
  return (
    <svg
      viewBox={`${-HALF_SIDE_CM} ${-HALF_SIDE_CM} ${2 * HALF_SIDE_CM} ${2 * HALF_SIDE_CM}`}
      role="img"
      aria-label={`Vue du dessus : robot à ${Math.round(xCm)} cm en x et ${Math.round(yCm)} cm en y, cap ${Math.round(headingDeg)} degrés`}
      className="topview"
    >
      {lines.map((v) => (
        <g key={v} stroke="var(--pierre)" strokeWidth="0.5">
          <line x1={v} y1={-HALF_SIDE_CM} x2={v} y2={HALF_SIDE_CM} />
          <line x1={-HALF_SIDE_CM} y1={v} x2={HALF_SIDE_CM} y2={v} />
        </g>
      ))}
      <g transform={`translate(${clamp(xCm)} ${-clamp(yCm)}) rotate(${-headingDeg})`}>
        <rect x="-9" y="-7" width="18" height="14" fill="var(--papier)" stroke="var(--encre)" />
        <path d="M9 0 L16 0 M12 -3 L16 0 L12 3" fill="none" stroke="var(--cobalt)" />
      </g>
    </svg>
  );
}

/** Télémétrie d'exemple de la maquette : valeurs factices qui varient légèrement. */
function useDemoTelemetry() {
  const [t, setT] = useState({ lat: 14, temp: 48 });
  useEffect(() => {
    const id = setInterval(
      () =>
        setT((p) => ({
          lat: 12 + Math.round(Math.random() * 5),
          temp: Math.round((p.temp + (Math.random() - 0.5) * 0.6) * 10) / 10,
        })),
      2000,
    );
    return () => clearInterval(id);
  }, []);
  return t;
}

export function SimulationView({ sim }: Props) {
  const { snapshot: s, speed, setSpeed, log, send } = sim;
  const [scene3d, setScene3d] = useState(true);
  const [servos, setServos] = useState<ServoAngle[]>([]);
  const onUnavailable = useCallback(() => setScene3d(false), []);
  const tele = useDemoTelemetry();
  const blocked = s.emergencyStopped;
  const status = statusLabel(s);
  const heading = Math.round(s.headingDeg);

  const cells: [string, string | number, string][] = [
    ['Latence', tele.lat, 'ms'],
    ['Débit', '30', 'Mbit/s'],
    ['Batterie', fv(7.99, 2), 'V'],
    ['Température', fv(tele.temp, 1), '°C'],
    ['Obstacle', 62, 'cm'],
    ['Vitesse', speed, '/ 70'],
  ];

  return (
    <section aria-labelledby="h-sim">
      <div className="sechead">
        <h1 className="sec" id="h-sim">
          Simulation<span>du robot</span>
        </h1>
        <p>
          Le modèle reproduit les commandes de pose et de marche sans matériel. Modèle 3D tiré du
          fichier STEP publié par SunFounder, avec ses 12 servos.
        </p>
      </div>
      <div className="g12">
        <div className="s7 col left">
          <figure>
            <div className="plate">
              <div className="stage">
                <div className="simband">Simulation · aucun robot réel n&apos;est piloté</div>
                {scene3d ? (
                  <SceneView snapshot={s} onUnavailable={onUnavailable} onServos={setServos} />
                ) : (
                  <TopView xCm={s.xCm} yCm={s.yCm} headingDeg={s.headingDeg} />
                )}
                <div className="hud tl" aria-hidden="true">
                  Vue orbitale · glisser pour tourner
                </div>
                <div className="hud br">
                  Pose : {status} · cap {heading}°
                </div>
              </div>
            </div>
            <figcaption>
              {scene3d
                ? 'Fig. 1 — Modèle 3D du PiCrawler, vue orbitale. Faire glisser pour tourner autour.'
                : 'Fig. 1 — Vue du dessus, carré de 2 m de côté. Le modèle 3D est indisponible.'}
            </figcaption>
          </figure>
          <dl className="band" aria-label="Télémétrie simulée">
            {cells.map(([k, v, u]) => (
              <div key={k}>
                <dt className="k">{k}</dt>
                <dd className="v">
                  {v}
                  <small>{u}</small>
                </dd>
              </div>
            ))}
          </dl>
          <div className="spec" aria-label="Caractéristiques">
            <div>
              <b>Mobilité</b>
              <span>4 pattes · 12 servos · ±90°</span>
            </div>
            <div>
              <b>Perception</b>
              <span>Caméra OV5647 · ultrasons</span>
            </div>
            <div>
              <b>Énergie</b>
              <span>Batterie 8,4 V pleine</span>
            </div>
            <div>
              <b>Calcul</b>
              <span>Raspberry Pi 4 · Robot HAT V4</span>
            </div>
          </div>
        </div>
        <div className="s5 col">
          <section className="pnl" aria-labelledby="p-etat">
            <header className="ph">
              <h2 id="p-etat">État du robot</h2>
              <span className="state st-on">
                <span className="dot" aria-hidden="true" />
                Simulé
              </span>
            </header>
            <dl className="fleetcard">
              <dt>Robot</dt>
              <dd>PiCrawler-01 · sim</dd>
              <dt>Statut</dt>
              <dd>{capitalize(status)}</dd>
              <dt>Site</dt>
              <dd>Simulateur local</dd>
              <dt>Cap</dt>
              <dd>{heading}°</dd>
              <dt>Vitesse</dt>
              <dd>{speed} / 70</dd>
            </dl>
          </section>
          <section className="pnl" aria-labelledby="p-cmd">
            <header className="ph">
              <h2 id="p-cmd">Pose et marche</h2>
              <span className="meta">flèches du clavier, focus sur une commande</span>
            </header>
            <div className="pb">
              <div className="poses" role="group" aria-label="Pose">
                {(
                  [
                    ['sit', 'Assis'],
                    ['stand', 'Debout'],
                    ['wave', 'Saluer'],
                  ] as const
                ).map(([type, label]) => (
                  <button
                    key={type}
                    type="button"
                    className="btn"
                    disabled={blocked}
                    onClick={() => send({ type, speed })}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <WalkPad blocked={blocked} speed={speed} send={send} />
              <div className="speed">
                <label htmlFor="spd">
                  Vitesse <span className="spdv">{speed}</span> · plage {MIN_SPEED} à {MAX_SPEED}
                </label>
                <input
                  id="spd"
                  type="range"
                  min={MIN_SPEED}
                  max={MAX_SPEED}
                  step={5}
                  value={speed}
                  aria-describedby="spdHint"
                  onChange={(e) => setSpeed(Number(e.target.value))}
                />
                <p className="note" id="spdHint">
                  Une vitesse hors de la plage 20 à 70 est refusée, jamais ramenée dans la plage.
                </p>
              </div>
            </div>
          </section>
          <section className="pnl" aria-labelledby="p-servos">
            <header className="ph">
              <h2 id="p-servos">Servos · angles commandés</h2>
            </header>
            <div className="pb">
              <div className="servos">
                {(servos.length
                  ? servos
                  : Array.from({ length: 12 }, (_, port) => ({ port, leg: 0, deg: NaN }))
                ).map((a) => (
                  <div key={a.port}>
                    <span>
                      P{a.port}
                      {a.leg ? ` · patte ${a.leg}` : ''}
                    </span>
                    <b>{Number.isNaN(a.deg) ? '—' : `${a.deg > 0 ? '+' : ''}${a.deg}°`}</b>
                  </div>
                ))}
              </div>
              <p className="note">
                Ports du Robot HAT par patte : 1 P9 à P11, 2 P3 à P5, 3 P0 à P2, 4 P6 à P8.
              </p>
            </div>
          </section>
          <section className="pnl" aria-labelledby="p-log">
            <header className="ph">
              <h2 id="p-log">Journal</h2>
            </header>
            <ul className="log" aria-live="polite" aria-relevant="additions" aria-atomic="false">
              {log.map((e) => (
                <li key={e.id}>
                  {e.time}&nbsp; {e.text}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </section>
  );
}

function WalkPad({
  blocked,
  speed,
  send,
}: {
  blocked: boolean;
  speed: number;
  send: Simulation['send'];
}) {
  const walk = (direction: 'forward' | 'backward'): Command => ({
    type: 'walk',
    direction,
    steps: STEPS_PER_PRESS,
    speed,
  });
  const turn = (direction: 'left' | 'right'): Command => ({
    type: 'turn',
    direction,
    steps: STEPS_PER_PRESS,
    speed,
  });
  const keys: Record<string, Command> = {
    ArrowUp: walk('forward'),
    ArrowDown: walk('backward'),
    ArrowLeft: turn('left'),
    ArrowRight: turn('right'),
  };
  // Flèches actives seulement quand le focus est sur une commande de ce pavé.
  const onKeyDown = (e: React.KeyboardEvent) => {
    const cmd = keys[e.key];
    if (cmd && !blocked) {
      e.preventDefault();
      send(cmd);
    }
  };
  const btn = (label: string, cmd: Command) => (
    <button
      type="button"
      className="btn"
      disabled={blocked}
      onKeyDown={onKeyDown}
      onClick={() => send(cmd)}
    >
      {label}
    </button>
  );
  return (
    <div className="pad3" role="group" aria-label="Marche">
      <span />
      {btn('Avancer', walk('forward'))}
      <span />
      {btn('Gauche', turn('left'))}
      {btn('Reculer', walk('backward'))}
      {btn('Droite', turn('right'))}
    </div>
  );
}
