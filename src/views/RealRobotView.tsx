import { useCallback, useEffect, useRef, useState } from 'react';
import {
  alertsFor,
  commandGate,
  effective,
  LIMITS,
  TOKEN_MIN_LENGTH,
  type DemoAlert,
  type FeedState,
  type Telemetry,
} from '../domain/realRobotDemo';
import { MAX_SPEED, MIN_SPEED } from '../domain/simulatedRobot';
import { VideoFrame } from '../components/VideoFrame';
import { ControlKeys, type Key } from '../components/ControlKeys';
import { useDemoTelemetry } from '../hooks/useDemoTelemetry';
import type { Simulation } from '../hooks/useSimulation';

const fv = (v: number, d: number) => v.toFixed(d).replace('.', ',');
const MIN_INTERVAL_MS = 250;

const LABELS: Record<Key, string> = {
  sit: 'Assis',
  stand: 'Debout',
  wave: 'Saluer',
  forward: 'Avancer',
  backward: 'Reculer',
  left: 'Tourner à gauche',
  right: 'Tourner à droite',
};
const FEED_LABEL: Record<FeedState, string> = {
  on: 'Connecté',
  loading: 'Chargement du flux',
  off: 'Déconnecté',
};
const ALERT_LABEL: Record<DemoAlert, string> = {
  none: 'Aucune',
  bat: 'Batterie basse',
  obst: 'Obstacle proche',
  temp: 'Surchauffe',
  link: 'Liaison perdue',
};

/** Horloge du navigateur, lue seulement dans les gestionnaires d'événements. */
const nowMs = () => Date.now();

type Entry = { id: number; time: string; text: string };

function stamp(): string {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
}

function State({ kind, children }: { kind: 'on' | 'load' | 'off'; children: string }) {
  return (
    <span className={`state st-${kind}`}>
      <span
        className={kind === 'load' ? 'spin' : kind === 'off' ? 'dot ring' : 'dot'}
        aria-hidden
      />
      {children}
    </span>
  );
}

/** Image d'exemple de la maquette : aucun robot réel n'est joint. */
function drawSample(canvas: HTMLCanvasElement) {
  if (/jsdom/i.test(navigator.userAgent)) return;
  const x = canvas.getContext('2d');
  if (!x) return;
  const W = 1280;
  const H = 720;
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#3a3f4a');
  g.addColorStop(0.56, '#59606b');
  g.addColorStop(0.56, '#7a6650');
  g.addColorStop(1, '#4a3c2c');
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(255,255,255,.10)';
  x.lineWidth = 2;
  for (let i = -8; i <= 8; i++) {
    x.beginPath();
    x.moveTo(W / 2 + i * 30, H * 0.56);
    x.lineTo(W / 2 + i * 230, H);
    x.stroke();
  }
  x.fillStyle = '#8a929c';
  x.fillRect(210, 250, 240, 180);
  x.fillStyle = '#646c76';
  x.fillRect(860, 300, 170, 130);
  x.strokeStyle = '#E1A720';
  x.lineWidth = 3;
  x.strokeRect(560, 300, 160, 120);
  x.fillStyle = '#E1A720';
  x.font = '20px Oswald, sans-serif';
  x.fillText('OBSTACLE · 62 CM', 560, 288);
  x.fillStyle = 'rgba(255,255,255,.6)';
  x.font = '26px Oswald, sans-serif';
  x.textAlign = 'center';
  x.fillText("IMAGE D'EXEMPLE · MAQUETTE", W / 2, 150);
}

type Props = { sim: Simulation };

/**
 * Écran Robot réel. Aucun robot n'est joint : le flux, les mesures et les commandes
 * sont simulés comme dans la maquette, en attendant le raccordement au backend.
 */
export function RealRobotView({ sim }: Props) {
  const { speed, setSpeed, snapshot } = sim;
  const estop = snapshot.emergencyStopped;
  const demo = useDemoTelemetry();
  const tele: Telemetry = {
    latencyMs: demo.lat,
    batteryV: 7.99,
    tempC: demo.temp,
    obstacleCm: 62,
  };
  const [session, setSession] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [feed, setFeed] = useState<FeedState>('on');
  const [alert, setAlert] = useState<DemoAlert>('none');
  const [pose, setPose] = useState<'assis' | 'debout'>('assis');
  const [log, setLog] = useState<Entry[]>(() => [
    { id: 0, time: stamp(), text: 'Console prête · aucun robot réel joint' },
  ]);
  const [clock, setClock] = useState(stamp);
  const nextId = useRef(1);
  const lastCmd = useRef(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const token = useRef<HTMLInputElement>(null);

  const write = useCallback((text: string) => {
    setLog((l) => [{ id: nextId.current++, time: stamp(), text }, ...l].slice(0, 30));
  }, []);

  useEffect(() => {
    if (canvas.current) drawSample(canvas.current);
    const id = setInterval(() => setClock(stamp()), 1000);
    return () => clearInterval(id);
  }, []);

  // L'arrêt d'urgence est commun à tous les écrans : le robot réel s'assoit aussi.
  const [seenStop, setSeenStop] = useState(estop);
  if (seenStop !== estop) {
    setSeenStop(estop);
    if (estop) setPose('assis');
  }
  const firstStop = useRef(true);
  useEffect(() => {
    if (firstStop.current) {
      firstStop.current = false;
      return;
    }
    if (estop) {
      write("Arrêt d'urgence : position assise");
    } else {
      write('Arrêt réarmé');
    }
  }, [estop, write]);

  const e = effective(tele, alert);
  const alerts = alertsFor(tele, alert, feed);
  const gate = commandGate({ session, feed, estop, link: e.link });
  const on = feed === 'on';

  const send = (c: Key) => {
    if (!gate.open || c === 'wave') return;
    const now = nowMs();
    if (now - lastCmd.current < MIN_INTERVAL_MS) return;
    lastCmd.current = now;
    if (c === 'sit') setPose('assis');
    else if (c === 'stand') setPose('debout');
    write(c === 'sit' || c === 'stand' ? LABELS[c] : `${LABELS[c]} · vitesse ${speed}`);
  };

  const chooseAlert = (a: DemoAlert) => {
    setAlert(a);
    if (a === 'link' && !estop) {
      setPose('assis');
      write("Pulsation perdue : le robot s'assoit seul");
    }
    write(`Démonstration : ${ALERT_LABEL[a].toLowerCase()}`);
  };

  const chooseFeed = (f: FeedState) => {
    setFeed(f);
    write(`Flux : ${FEED_LABEL[f].toLowerCase()}`);
  };

  const retry = () => {
    setFeed('loading');
    write('Nouvelle tentative de connexion au flux');
    setTimeout(() => {
      setFeed((f) => {
        if (f !== 'loading') return f;
        write('Flux connecté');
        return 'on';
      });
    }, 1600);
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const input = token.current!;
    if (input.value.length < TOKEN_MIN_LENGTH) {
      setTokenError(`Jeton trop court : ${TOKEN_MIN_LENGTH} caractères minimum.`);
      return;
    }
    setTokenError('');
    input.value = '';
    setSession(true);
    write('Session opérateur ouverte');
  };

  const status = estop
    ? "Arrêt d'urgence"
    : !e.link
      ? 'Assis · liaison perdue'
      : on
        ? pose === 'assis'
          ? 'Assis'
          : 'Debout'
        : 'Hors ligne';

  const big: [string, string | number, string, string][] = [
    ['Latence', on ? tele.latencyMs : '—', 'ms', ''],
    ['Débit', on ? '30' : '—', 'Mbit/s', ''],
    ['Batterie', fv(e.batteryV, 2), 'V', e.batteryV < LIMITS.batteryMinV ? 'basse' : ''],
    ['Température', fv(e.tempC, 1), '°C', e.tempC >= LIMITS.tempMaxC ? 'élevée' : ''],
    [
      'Obstacle',
      on ? e.obstacleCm : '—',
      'cm',
      on && e.obstacleCm < LIMITS.obstacleMinCm ? 'proche' : '',
    ],
  ];

  return (
    <section aria-labelledby="h-rob">
      <div className="sechead">
        <h1 className="sec" id="h-rob">
          Robot à Paris<span>poste à Toulouse</span>
        </h1>
        <p>
          Le robot est téléopéré : chaque mouvement est décidé depuis ce poste. Le flux vidéo passe
          uniquement par la liaison privée.
        </p>
      </div>
      <div className="alertbox" role="alert">
        {alerts.map((a) => (
          <div key={a.title} className={`alertbar ${a.level}`}>
            <span className="sym" aria-hidden="true">
              {a.level === 'crit' ? '■' : '▲'}
            </span>
            <div>
              <b>
                {a.level === 'crit' ? 'Alerte critique · ' : 'Alerte · '}
                {a.title}
              </b>
              <p>{a.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="stack">
        <div className="col left">
          <figure>
            <div className="plate">
              <VideoFrame
                className={`feed ${feed === 'loading' ? 'loading' : feed === 'off' ? 'off' : ''}`}
              >
                <canvas
                  ref={canvas}
                  width={1280}
                  height={720}
                  role="img"
                  aria-label="Flux caméra du robot, image d'exemple"
                />
                <div className="feedtop">
                  <span>PiCrawler-01 · caméra OV5647</span>
                  <span>{clock} Paris</span>
                </div>
                <ControlKeys
                  poses={['sit', 'stand']}
                  disabled={!gate.open}
                  gate={gate.label}
                  speed={speed}
                  min={MIN_SPEED}
                  max={MAX_SPEED}
                  onSpeed={setSpeed}
                  onPress={send}
                  walkLabel="Marche du robot réel"
                />
                <div className="feedmsg">
                  {feed === 'loading' && (
                    <div>
                      <State kind="load">Chargement du flux</State>
                      <span className="cap">Connexion à la caméra par la liaison privée</span>
                    </div>
                  )}
                  {feed === 'off' && (
                    <div>
                      <State kind="off">Flux indisponible</State>
                      <span>Vérifier la liaison puis réessayer.</span>
                      <button type="button" className="btn" onClick={retry}>
                        Réessayer
                      </button>
                    </div>
                  )}
                </div>
              </VideoFrame>
            </div>
            <figcaption>
              Fig. 2 — Caméra OV5647, flux MJPEG par la liaison privée. Image d&apos;exemple de la
              maquette.
            </figcaption>
          </figure>
          <dl className="big" aria-label="Mesures du robot, valeurs d'exemple">
            {big.map(([k, v, u, al]) => (
              <div key={k} className={al ? 'alrt' : undefined}>
                <dt className="k">
                  {al && <span aria-hidden="true">▲ </span>}
                  {k}
                  {al && ` · ${al}`}
                </dt>
                <dd className="v">
                  {v}
                  <small>{u}</small>
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="panels">
          <section className="pnl" aria-labelledby="r-sess">
            <header className="ph">
              <h2 id="r-sess">
                <span className="num">01</span>Session opérateur
              </h2>
              {session ? <State kind="on">Ouverte</State> : <State kind="off">Fermée</State>}
            </header>
            <form className="login" onSubmit={submit} noValidate>
              <div>
                <label htmlFor="tok">Jeton opérateur</label>
                <input
                  id="tok"
                  ref={token}
                  type="password"
                  autoComplete="off"
                  placeholder={`${TOKEN_MIN_LENGTH} caractères minimum`}
                  aria-required="true"
                  aria-invalid={tokenError ? 'true' : undefined}
                  aria-describedby="tokHint tokErr"
                />
                <p className="note hint" id="tokHint">
                  {TOKEN_MIN_LENGTH} caractères minimum, remis par l&apos;opérateur du robot.
                </p>
                <div id="tokErr" role="alert" className="err">
                  {tokenError && (
                    <>
                      <b aria-hidden="true">■</b> {tokenError}
                    </>
                  )}
                </div>
              </div>
              <div className="row">
                <button type="submit" className="btn primary">
                  Ouvrir la session
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setSession(false);
                    write('Session fermée');
                  }}
                >
                  Fermer
                </button>
              </div>
            </form>
          </section>
          <section className="pnl" aria-labelledby="r-flux">
            <header className="ph">
              <h2 id="r-flux">
                <span className="num">02</span>Flux caméra
              </h2>
              {feed === 'on' ? (
                <State kind="on">Connecté</State>
              ) : feed === 'loading' ? (
                <State kind="load">Chargement</State>
              ) : (
                <State kind="off">Déconnecté</State>
              )}
            </header>
            <div className="pb">
              <dl className="fleetcard">
                <dt>Robot</dt>
                <dd>PiCrawler-01</dd>
                <dt>Statut</dt>
                <dd>{status}</dd>
                <dt>Site</dt>
                <dd>Paris · domicile cliente</dd>
                <dt>Poste</dt>
                <dd>Toulouse · 680 km</dd>
                <dt>Flux</dt>
                <dd>{FEED_LABEL[feed]}</dd>
                <dt>Pulsation</dt>
                <dd>{e.link ? `Reçue · délai ${LIMITS.heartbeatS} s` : 'Perdue'}</dd>
              </dl>
              <Demo label="État de démonstration du flux">
                {(['on', 'loading', 'off'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={feed === f}
                    onClick={() => chooseFeed(f)}
                  >
                    {f === 'on' ? 'Connecté' : f === 'loading' ? 'Chargement' : 'Déconnecté'}
                  </button>
                ))}
              </Demo>
              <Demo label="État de démonstration des alertes" wrap>
                {(Object.keys(ALERT_LABEL) as DemoAlert[]).map((a) => (
                  <button
                    key={a}
                    type="button"
                    aria-pressed={alert === a}
                    onClick={() => chooseAlert(a)}
                  >
                    {ALERT_LABEL[a]}
                  </button>
                ))}
              </Demo>
              <p className="note">
                Maquette : aucun robot n&apos;est joint, l&apos;image est factice. Seuils
                d&apos;alerte provisoires, à confirmer.
              </p>
            </div>
          </section>
          <section className="pnl" aria-labelledby="r-log">
            <header className="ph">
              <h2 id="r-log">Journal</h2>
            </header>
            <ul className="log" aria-live="polite" aria-relevant="additions" aria-atomic="false">
              {log.map((l) => (
                <li key={l.id}>
                  {l.time}&nbsp; {l.text}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </section>
  );
}

function Demo({
  label,
  wrap,
  children,
}: {
  label: string;
  wrap?: boolean;
  children: React.ReactNode;
}) {
  const id = label.replace(/\W+/g, '-');
  return (
    <div className="demo">
      <span className="lbl" id={id}>
        {label}
      </span>
      <div
        className="seg"
        role="group"
        aria-labelledby={id}
        style={wrap ? { flexWrap: 'wrap' } : undefined}
      >
        {children}
      </div>
    </div>
  );
}
