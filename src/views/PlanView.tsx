import { useRef, useState } from 'react';
import { WiringScene } from '../scene/WiringScene';
import { PlanViewer, type ViewerTarget } from '../components/PlanViewer';
import { Pictogram } from '../components/Pictogram';
import { VideoEmbed } from '../components/VideoEmbed';
import {
  FASTENERS,
  JOINTS,
  LEG_PORTS,
  OTHER_PARTS,
  PHASES,
  PLAN_AREAS,
  PLATES,
  STEPS,
  VIDEO,
  planStep,
  stepImage,
  type Part,
  type Phase,
} from './planData';

const SECTIONS = [
  ['video', 'Vidéo'],
  ['pieces', 'Pièces'],
  ['assemblage', 'Assemblage'],
  ['cablage', 'Câblage'],
] as const;

function PartCell({ p }: { p: Part }) {
  return (
    <li className="part">
      <Pictogram kind={p.picto} />
      <span className="part-name">
        {p.name}
        {p.spec && <b> {p.spec}</b>}
        {p.qty && <b> {p.qty}</b>}
      </span>
    </li>
  );
}

/** Câblage vu du dessus, avant en haut : ports du Robot HAT par patte. */
function WiringDiagram() {
  const legs = {
    1: { corner: [460, 125], foot: [570, 66], anchor: 'start', tx: 592 },
    2: { corner: [300, 125], foot: [190, 66], anchor: 'end', tx: 168 },
    3: { corner: [300, 235], foot: [190, 314], anchor: 'end', tx: 168 },
    4: { corner: [460, 235], foot: [570, 314], anchor: 'start', tx: 592 },
  } as const;
  return (
    <svg
      className="diagram"
      viewBox="0 0 760 380"
      role="img"
      aria-label="Câblage vu du dessus, avant en haut. Patte 1 avant droite : P9, P10, P11. Patte 2 avant gauche : P3, P4, P5. Patte 3 arrière gauche : P0, P1, P2. Patte 4 arrière droite : P6, P7, P8. Module à ultrasons : D2 et D3."
    >
      <rect
        x="300"
        y="110"
        width="160"
        height="140"
        fill="var(--papier)"
        stroke="var(--encre)"
        strokeWidth="2"
      />
      <text x="380" y="186" textAnchor="middle" className="dg-title">
        Robot HAT
      </text>
      <text x="380" y="206" textAnchor="middle" className="dg-sub">
        Raspberry Pi 4
      </text>
      <circle
        cx="350"
        cy="110"
        r="12"
        fill="var(--cobalt)"
        fillOpacity="0.25"
        stroke="var(--encre)"
        strokeWidth="1.5"
      />
      <circle
        cx="410"
        cy="110"
        r="12"
        fill="var(--cobalt)"
        fillOpacity="0.25"
        stroke="var(--encre)"
        strokeWidth="1.5"
      />
      <text x="380" y="76" textAnchor="middle" className="dg-title">
        Avant
      </text>
      <text x="380" y="94" textAnchor="middle" className="dg-sub">
        ultrasons : GND · 3V3 · D2 · D3
      </text>
      <path
        d="M380 58 V40 M374 46 L380 38 L386 46"
        stroke="var(--ocre)"
        strokeWidth="3"
        fill="none"
      />
      {LEG_PORTS.map(({ leg, side, ports }) => {
        const g = legs[leg as 1 | 2 | 3 | 4];
        return (
          <g key={leg}>
            <path
              d={`M${g.corner[0]} ${g.corner[1] + (leg > 2 ? 10 : -10) * 0} L${g.foot[0]} ${g.foot[1]}`}
              stroke="var(--cobalt)"
              strokeWidth="9"
              strokeLinecap="round"
            />
            <circle
              cx={g.foot[0]}
              cy={g.foot[1]}
              r="13"
              fill="var(--papier)"
              stroke="var(--encre)"
              strokeWidth="2"
            />
            <text x={g.foot[0]} y={g.foot[1] + 5} textAnchor="middle" className="dg-leg">
              {leg}
            </text>
            <text x={g.tx} y={g.foot[1] - 14} textAnchor={g.anchor} className="dg-title">
              Patte {leg}
            </text>
            <text x={g.tx} y={g.foot[1] + 2} textAnchor={g.anchor} className="dg-sub">
              {side}
            </text>
            {ports.map((p, i) => (
              <text
                key={p}
                x={g.tx}
                y={g.foot[1] + 20 + i * 17}
                textAnchor={g.anchor}
                className="dg-port"
              >
                P{p} · {JOINTS[i]}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

export function PlanView() {
  const [phase, setPhase] = useState<Phase | 'all'>('all');
  const [mode, setMode] = useState<'plan' | '3d'>('plan');
  const [viewer, setViewer] = useState<ViewerTarget | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const base = import.meta.env.BASE_URL;
  const openPlan = (t: ViewerTarget) => {
    opener.current = document.activeElement as HTMLElement | null;
    setViewer(t);
  };
  const closePlan = () => {
    setViewer(null);
    opener.current?.focus?.();
  };
  const goto = (id: string) => {
    const el = document.getElementById(`pl-${id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el?.focus({ preventScroll: true });
  };
  const steps = phase === 'all' ? STEPS : STEPS.filter((s) => s.phase === phase);

  return (
    <section aria-labelledby="h-plan">
      <div className="sechead">
        <h1 className="sec" id="h-plan">
          Plan &amp; montage<span>du robot</span>
        </h1>
        <p>
          Plan de montage SunFounder du PiCrawler : la vidéo de montage, les pièces, 32 étapes
          d&apos;assemblage et le câblage des servos sur le modèle 3D.
        </p>
      </div>

      <nav className="plan-nav" aria-label="Sections du plan">
        {SECTIONS.map(([id, label]) => (
          <button key={id} type="button" className="chip" onClick={() => goto(id)}>
            {label}
          </button>
        ))}
      </nav>

      <div className="plan-doc">
        <button
          type="button"
          className="chip chip-main"
          onClick={() => openPlan({ label: 'Page 1' })}
        >
          Ouvrir le plan d&apos;origine (zoom)
        </button>
      </div>

      <section id="pl-video" tabIndex={-1} className="plan-sec" aria-labelledby="h-video">
        <h2 id="h-video" className="plan-h">
          <span className="num">00</span>Vidéo de montage
        </h2>
        <VideoEmbed
          title="Vidéo de montage du PiCrawler"
          embedUrl={VIDEO.embed}
          watchUrl={VIDEO.watch}
          poster={`${base}plan/robot.webp`}
          caption="SunFounder PiCrawler Kit for Raspberry Pi, tutoriel d’assemblage · chaîne SunFounder Maker Education."
        />
      </section>

      <section id="pl-pieces" tabIndex={-1} className="plan-sec" aria-labelledby="h-pieces">
        <h2 id="h-pieces" className="plan-h">
          <span className="num">01</span>Pièces
        </h2>
        <p>
          <button
            type="button"
            className="chip"
            onClick={() => openPlan({ label: 'Liste des pièces', region: PLAN_AREAS.pieces })}
          >
            Voir la liste des pièces sur le plan
          </button>
        </p>
        <h3 className="plan-h3">Plaques structurelles</h3>
        <ul className="plates">
          {PLATES.map((p) => (
            <li key={p.id}>
              <span className="plate-badge" aria-hidden="true">
                {p.id}
              </span>
              <div>
                <b>
                  {p.name} <span className="qty">× {p.qty}</span>
                </b>
                <span>{p.role}</span>
              </div>
            </li>
          ))}
        </ul>
        <h3 className="plan-h3">Visserie et entretoises</h3>
        <ul className="parts">
          {FASTENERS.map((p) => (
            <PartCell key={`${p.name}${p.spec}`} p={p} />
          ))}
        </ul>
        <h3 className="plan-h3">Électronique, câbles et outils</h3>
        <ul className="parts">
          {OTHER_PARTS.map((p) => (
            <PartCell key={p.name} p={p} />
          ))}
        </ul>
      </section>

      <section id="pl-assemblage" tabIndex={-1} className="plan-sec" aria-labelledby="h-assemblage">
        <h2 id="h-assemblage" className="plan-h">
          <span className="num">02</span>Assemblage
        </h2>
        <div className="seg phases" role="group" aria-label="Phase d'assemblage">
          <button type="button" aria-pressed={phase === 'all'} onClick={() => setPhase('all')}>
            Tout · 32
          </button>
          {PHASES.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={phase === p.id}
              onClick={() => setPhase(p.id)}
            >
              {p.title} · {p.range.replace('Étapes ', '')}
            </button>
          ))}
        </div>
        <div className="seg modes" role="group" aria-label="Illustrations des étapes">
          <button type="button" aria-pressed={mode === 'plan'} onClick={() => setMode('plan')}>
            Plan SunFounder
          </button>
          <button type="button" aria-pressed={mode === '3d'} onClick={() => setMode('3d')}>
            Modèle 3D
          </button>
        </div>
        <ol className="steps">
          {steps.map((s) => (
            <li key={s.n} className="step" id={`etape-${s.n}`}>
              <div className="step-head">
                <span className="step-n" aria-hidden="true">
                  {s.n}
                </span>
                <Pictogram kind={s.picto} />
              </div>
              {(() => {
                const crop = planStep(s.n, base);
                const r3 = stepImage(s.n, base);
                const src = mode === 'plan' || !r3 ? crop.src : r3.src;
                const alt =
                  mode === 'plan' || !r3 ? `Illustration SunFounder de l'étape ${s.n}` : r3.alt;
                return (
                  <button
                    type="button"
                    className={mode === 'plan' ? 'step-render on-plan' : 'step-render'}
                    aria-label={`Étape ${s.n} : agrandir sur le plan d'origine`}
                    onClick={() => openPlan({ label: `Étape ${s.n}`, region: crop.region })}
                  >
                    <img src={src} alt={alt} loading="lazy" decoding="async" />
                    <span className="step-zoom" aria-hidden="true">
                      ⤢ Agrandir
                    </span>
                  </button>
                );
              })()}
              <h3>
                <span className="sr">Étape {s.n} : </span>
                {s.title}
              </h3>
              <p>{s.text}</p>
              {s.parts.length > 0 && (
                <ul className="tags" aria-label="Pièces de l'étape">
                  {s.parts.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              )}
              {s.note && (
                <p className="warn">
                  <b aria-hidden="true">▲ </b>
                  {s.note}
                </p>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section id="pl-cablage" tabIndex={-1} className="plan-sec" aria-labelledby="h-cablage">
        <h2 id="h-cablage" className="plan-h">
          <span className="num">03</span>Câblage
        </h2>
        <p className="plan-actions">
          <button
            type="button"
            className="chip"
            onClick={() => openPlan({ label: 'Câblage des servos', region: PLAN_AREAS.cablage })}
          >
            Voir le câblage sur le plan
          </button>
          <button
            type="button"
            className="chip"
            onClick={() =>
              openPlan({ label: 'Câblage du module à ultrasons', region: PLAN_AREAS.ultrasons })
            }
          >
            Voir le module à ultrasons sur le plan
          </button>
        </p>
        <div className="plan-two">
          <figure>
            <div className="plate">
              <WiringScene fallback={<WiringDiagram />} />
            </div>
          </figure>
          <table className="ports">
            <caption className="sr">Ports du Robot HAT par patte et par articulation</caption>
            <thead>
              <tr>
                <th scope="col">Patte</th>
                {JOINTS.map((j) => (
                  <th key={j} scope="col">
                    {j}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...LEG_PORTS]
                .sort((a, b) => a.leg - b.leg)
                .map(({ leg, side, ports }) => (
                  <tr key={leg}>
                    <th scope="row">
                      {leg} · {side}
                    </th>
                    {ports.map((p) => (
                      <td key={p}>P{p}</td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {viewer && <PlanViewer target={viewer} onClose={closePlan} />}
    </section>
  );
}
