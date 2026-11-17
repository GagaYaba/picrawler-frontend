import { useCallback, useEffect, useRef, useState } from 'react';
import { PLAN_PDF, type PlanRegion } from '../views/planData';

export type ViewerTarget = { label: string; region?: PlanRegion; page?: 1 | 2 };

type View = { s: number; x: number; y: number; fit: number };

const MAX_PIXEL_RATIO = 3; // au plus 3 pixels écran par pixel d'image
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

type Props = { target: ViewerTarget; onClose: () => void };

/**
 * Visionneuse du plan d'assemblage : zoom (molette, pincement, boutons, Maj + flèches haut et
 * bas), déplacement (glisser ou flèches), changement de page et ouverture du PDF d'origine.
 * Échap reste l'arrêt d'urgence : la fermeture passe par le bouton, et l'arrêt d'urgence est
 * rappelé dans la barre d'outils.
 */
export function PlanViewer({ target, onClose }: Props) {
  const base = import.meta.env.BASE_URL;
  const [page, setPage] = useState<1 | 2>(target.region?.page ?? target.page ?? 1);
  const [view, setView] = useState<View | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const region = target.region && target.region.page === page ? target.region : undefined;

  /** Cadrage : la zone demandée, ou la page entière. */
  const fitView = useCallback((r?: PlanRegion): View | null => {
    const st = stage.current;
    const im = img.current;
    if (!st || !im || !im.naturalWidth || !st.clientWidth || !st.clientHeight) return null;
    const cw = st.clientWidth;
    const ch = st.clientHeight;
    const nw = im.naturalWidth;
    const nh = im.naturalHeight;
    const fitPage = Math.min(cw / nw, ch / nh);
    const box = r
      ? { x: r.x * nw, y: r.y * nh, w: r.w * nw, h: r.h * nh }
      : { x: 0, y: 0, w: nw, h: nh };
    const margin = r ? 24 : 0;
    const s = clamp(
      Math.min((cw - 2 * margin) / box.w, (ch - 2 * margin) / box.h),
      fitPage * 0.5,
      MAX_PIXEL_RATIO,
    );
    return {
      s,
      fit: fitPage,
      x: cw / 2 - (box.x + box.w / 2) * s,
      y: ch / 2 - (box.y + box.h / 2) * s,
    };
  }, []);

  const zoomAt = useCallback((factor: number, cx?: number, cy?: number) => {
    const st = stage.current;
    if (!st) return;
    setView((v) => {
      if (!v) return v;
      const px = cx ?? st.clientWidth / 2;
      const py = cy ?? st.clientHeight / 2;
      const s = clamp(v.s * factor, v.fit * 0.5, MAX_PIXEL_RATIO);
      const k = s / v.s;
      return { ...v, s, x: px - (px - v.x) * k, y: py - (py - v.y) * k };
    });
  }, []);

  const panBy = useCallback((dx: number, dy: number) => {
    setView((v) => (v ? { ...v, x: v.x + dx, y: v.y + dy } : v));
  }, []);

  // La molette doit pouvoir annuler le défilement de la page : écouteur non passif.
  useEffect(() => {
    const st = stage.current;
    if (!st) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = st.getBoundingClientRect();
      const unit = e.deltaMode === 1 ? 16 : 1;
      zoomAt(Math.exp(-e.deltaY * unit * 0.0016), e.clientX - r.left, e.clientY - r.top);
    };
    st.addEventListener('wheel', onWheel, { passive: false });
    return () => st.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  // Le focus va sur le bouton Fermer à l'ouverture.
  useEffect(() => {
    closeBtn.current?.focus();
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const next = { x: e.clientX, y: e.clientY };
    const others = [...pointers.current.entries()].filter(([id]) => id !== e.pointerId);
    if (others.length === 0) {
      panBy(next.x - prev.x, next.y - prev.y);
    } else {
      // Pincement : le rapport des distances donne le zoom, le déplacement du centre le glissement.
      const o = others[0][1];
      const d0 = Math.hypot(prev.x - o.x, prev.y - o.y) || 1;
      const d1 = Math.hypot(next.x - o.x, next.y - o.y) || 1;
      const r = e.currentTarget.getBoundingClientRect();
      const cx = (next.x + o.x) / 2 - r.left;
      const cy = (next.y + o.y) / 2 - r.top;
      panBy((next.x - prev.x) / 2, (next.y - prev.y) / 2);
      zoomAt(d1 / d0, cx, cy);
    }
    pointers.current.set(e.pointerId, next);
  };
  const onPointerEnd = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    const step = 70;
    if (e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      zoomAt(e.key === 'ArrowUp' ? 1.25 : 0.8);
      return;
    }
    const d: Record<string, [number, number]> = {
      ArrowLeft: [step, 0],
      ArrowRight: [-step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    if (d[e.key]) {
      e.preventDefault();
      panBy(...d[e.key]);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setView((v) => fitView(region) ?? v);
    }
  };

  const percent = view ? Math.round((view.s / view.fit) * 100) : 100;
  const pageSrc = `${base}${PLAN_PDF.pages[page - 1]}`;

  return (
    <div className="pviewer" role="dialog" aria-label={`${PLAN_PDF.title} : ${target.label}`}>
      <div className="pv-bar">
        <p className="pv-title">
          <b>Plan SunFounder</b> <span>{target.label}</span>
        </p>
        <div className="seg pv-pages" role="group" aria-label="Page du plan">
          {([1, 2] as const).map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={page === p}
              onClick={() => {
                setPage(p);
                setView(null);
              }}
            >
              Page {p}
            </button>
          ))}
        </div>
        <div className="pv-zoom" role="group" aria-label="Zoom">
          <button type="button" onClick={() => zoomAt(0.8)} aria-label="Zoom arrière">
            −
          </button>
          <output aria-live="polite">{percent} %</output>
          <button type="button" onClick={() => zoomAt(1.25)} aria-label="Zoom avant">
            +
          </button>
          <button type="button" onClick={() => setView((v) => fitView(undefined) ?? v)}>
            Page entière
          </button>
          {region && (
            <button type="button" onClick={() => setView((v) => fitView(region) ?? v)}>
              Revenir à la zone
            </button>
          )}
        </div>
        <button ref={closeBtn} type="button" className="pv-close" onClick={onClose}>
          Fermer
        </button>
      </div>
      {/* Zone de déplacement et de zoom : widget propre, au clavier comme au pointeur. */}
      {/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
      <div
        ref={stage}
        className="pv-stage"
        role="application"
        tabIndex={0}
        aria-label="Plan d'assemblage. Flèches : déplacer. Maj et flèche haut ou bas : zoom. Début : page entière."
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <img
          key={page}
          ref={img}
          className="pv-img"
          src={pageSrc}
          alt={`Page ${page} du plan d'assemblage SunFounder PiCrawler`}
          draggable={false}
          style={
            view
              ? { transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})` }
              : { opacity: 0 }
          }
          onLoad={() => setView(fitView(region))}
        />
      </div>
      {/* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
    </div>
  );
}
