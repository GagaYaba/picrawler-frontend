import type { Picto } from '../views/planData';

const COBALT = 'var(--cobalt)';
const OCRE = 'var(--ocre)';

/** Pictogrammes au trait de la charte : encre pour le contour, cobalt et ocre pour l'accent. */
const DRAW: Record<Picto, React.ReactNode> = {
  cable: (
    <>
      <path d="M8 44 C28 44 24 20 44 20 S64 44 88 40" fill="none" strokeWidth="5" stroke={OCRE} />
      <path d="M8 44 C28 44 24 20 44 20 S64 44 88 40" fill="none" />
      <rect x="82" y="34" width="10" height="12" fill="var(--papier)" />
      <rect x="4" y="38" width="10" height="12" fill="var(--papier)" />
    </>
  ),
  camera: (
    <>
      <rect x="30" y="8" width="36" height="36" fill="var(--papier)" />
      <circle cx="48" cy="26" r="10" fill={COBALT} stroke="var(--encre)" />
      <circle cx="48" cy="26" r="4" fill="var(--encre)" />
      <path d="M40 44 V58 H56 V44" fill="none" stroke={OCRE} strokeWidth="4" />
    </>
  ),
  standoffs: (
    <>
      {[20, 42, 64].map((x) => (
        <g key={x}>
          <rect x={x} y="10" width="12" height="38" fill="var(--papier)" />
          <path d={`M${x} 18 H${x + 12} M${x} 40 H${x + 12}`} />
          <rect x={x + 4} y="2" width="4" height="8" fill={COBALT} stroke="none" />
        </g>
      ))}
    </>
  ),
  tape: (
    <>
      <rect x="22" y="14" width="52" height="34" fill={OCRE} fillOpacity="0.4" />
      <path d="M30 22 H66 M30 31 H66 M30 40 H66" strokeDasharray="3 4" />
    </>
  ),
  battery: (
    <>
      <rect x="14" y="16" width="62" height="30" rx="15" fill={COBALT} fillOpacity="0.25" />
      <path d="M76 31 H90" strokeWidth="3" />
      <path d="M28 24 H62" />
    </>
  ),
  sensor: (
    <>
      <rect x="10" y="12" width="76" height="36" fill="var(--papier)" />
      <circle cx="30" cy="30" r="12" fill={COBALT} fillOpacity="0.25" />
      <circle cx="66" cy="30" r="12" fill={COBALT} fillOpacity="0.25" />
      <circle cx="30" cy="30" r="5" />
      <circle cx="66" cy="30" r="5" />
    </>
  ),
  stack: (
    <>
      <path d="M14 18 L48 6 L82 18 L48 30 Z" fill="var(--papier)" />
      <path d="M14 46 L48 34 L82 46 L48 58 Z" fill="var(--papier)" />
      <path d="M30 24 V50 M66 24 V50" stroke={COBALT} strokeWidth="4" />
    </>
  ),
  wire: (
    <>
      <path d="M10 20 H62 Q84 20 84 40" fill="none" stroke="var(--encre)" strokeWidth="2" />
      <path d="M10 26 H58 Q78 26 78 40" fill="none" stroke={OCRE} strokeWidth="2" />
      <rect x="74" y="40" width="16" height="12" fill="var(--papier)" />
      <rect x="4" y="16" width="10" height="14" fill="var(--papier)" />
    </>
  ),
  board: (
    <>
      <rect x="14" y="10" width="68" height="44" fill={COBALT} fillOpacity="0.25" />
      {[24, 34, 44, 54, 64, 74].map((x) => (
        <path key={x} d={`M${x} 14 V22`} strokeWidth="3" />
      ))}
      <rect x="30" y="30" width="18" height="14" fill="var(--papier)" />
    </>
  ),
  servo: (
    <>
      <rect x="14" y="16" width="58" height="30" fill={COBALT} fillOpacity="0.3" />
      <rect x="6" y="24" width="8" height="14" fill="var(--papier)" />
      <circle cx="62" cy="31" r="6" fill="var(--papier)" />
      <path d="M62 31 L86 31" strokeWidth="5" stroke={OCRE} />
    </>
  ),
  arm: (
    <>
      <rect x="10" y="10" width="76" height="26" fill="var(--papier)" />
      <circle cx="26" cy="23" r="5" />
      <path d="M30 46 H70" stroke={COBALT} strokeWidth="6" />
      <path d="M36 36 V46 M64 36 V46" strokeDasharray="2 3" />
    </>
  ),
  plate: (
    <>
      <path d="M12 44 L30 12 H66 L84 44 Z" fill="var(--papier)" />
      <circle cx="36" cy="30" r="3" />
      <circle cx="60" cy="30" r="3" />
    </>
  ),
  rivet: (
    <>
      <circle cx="48" cy="22" r="14" fill="var(--papier)" />
      <path d="M48 36 V58" strokeWidth="5" stroke={COBALT} />
      <ellipse cx="48" cy="46" rx="14" ry="4" fill={OCRE} fillOpacity="0.5" />
    </>
  ),
  leg: (
    <>
      <path d="M12 52 L38 14 L56 22 L40 52 Z" fill="var(--papier)" />
      <path d="M44 22 L84 10 L86 26 L52 38 Z" fill="var(--papier)" />
      <circle cx="46" cy="22" r="5" fill={COBALT} stroke="none" />
    </>
  ),
  robot: (
    <>
      <rect x="30" y="20" width="36" height="22" fill="var(--papier)" />
      {[
        [30, 20, 10, 6],
        [66, 20, 86, 6],
        [30, 42, 10, 58],
        [66, 42, 86, 58],
      ].map(([x1, y1, x2, y2]) => (
        <path key={`${x2}${y2}`} d={`M${x1} ${y1} L${x2} ${y2}`} strokeWidth="4" stroke={COBALT} />
      ))}
    </>
  ),
  screw: (
    <>
      <rect x="34" y="10" width="28" height="8" fill="var(--papier)" />
      <path d="M48 18 V54" strokeWidth="6" stroke={COBALT} />
      <path d="M44 28 H52 M44 36 H52 M44 44 H52" strokeWidth="1.5" stroke="var(--papier)" />
    </>
  ),
  nut: (
    <>
      <path d="M48 10 L70 22 V42 L48 54 L26 42 V22 Z" fill="var(--papier)" />
      <circle cx="48" cy="32" r="8" />
    </>
  ),
  washer: (
    <>
      <circle cx="48" cy="32" r="22" fill="var(--papier)" />
      <circle cx="48" cy="32" r="8" />
    </>
  ),
  tool: (
    <>
      <path d="M16 48 L62 12" strokeWidth="6" stroke={COBALT} />
      <path d="M62 12 L74 8 L82 18 L72 24" fill="var(--papier)" />
    </>
  ),
  header: (
    <>
      <rect x="10" y="30" width="76" height="12" fill="var(--papier)" />
      {Array.from({ length: 10 }, (_, i) => (
        <path key={i} d={`M${16 + i * 7.5} 30 V10`} strokeWidth="2.5" stroke={OCRE} />
      ))}
    </>
  ),
  usb: (
    <>
      <rect x="10" y="26" width="26" height="14" fill="var(--papier)" />
      <path d="M36 33 H70" strokeWidth="4" />
      <rect x="70" y="27" width="16" height="12" rx="5" fill={COBALT} fillOpacity="0.3" />
    </>
  ),
};

export function Pictogram({ kind }: { kind: Picto }) {
  return (
    <svg
      className="picto"
      viewBox="0 0 96 64"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="var(--encre)"
      strokeWidth="1.8"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {DRAW[kind]}
    </svg>
  );
}
