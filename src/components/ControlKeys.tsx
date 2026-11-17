import { useContext, useEffect, useRef, useState } from 'react';
import { FrameModeContext } from './StopContext';

export type Key = 'sit' | 'stand' | 'wave' | 'forward' | 'backward' | 'left' | 'right';

const ARROWS: Record<string, Key> = {
  ArrowUp: 'forward',
  ArrowDown: 'backward',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

const GLYPH: Record<string, string> = { forward: '↑', backward: '↓', left: '←', right: '→' };
const LABEL: Record<Key, string> = {
  sit: 'Assis',
  stand: 'Debout',
  wave: 'Saluer',
  forward: 'Avancer',
  backward: 'Reculer',
  left: 'Gauche',
  right: 'Droite',
};

type Props = {
  /** Poses proposées, dans l'ordre d'affichage. */
  poses: readonly ('sit' | 'stand' | 'wave')[];
  disabled: boolean;
  /** Libellé court de l'état des commandes, affiché seulement quand elles sont fermées. */
  gate?: string;
  speed: number;
  min: number;
  max: number;
  onPress: (key: Key) => void;
  onSpeed: (value: number) => void;
  /** Nom du groupe de marche pour les lecteurs d'écran. */
  walkLabel?: string;
};

/**
 * Commandes de pose et de marche, dessinées comme de vraies touches de clavier en volume,
 * posées sur la vue 3D ou la caméra. Ce sont des boutons : un clic ou un appui sur Entrée ou
 * Espace les actionne, et les flèches du clavier commandent la marche quand le focus est sur
 * l'une d'elles. Aucun raccourci à une seule lettre (RGAA 12.10).
 */
export function ControlKeys({
  poses,
  disabled,
  gate,
  speed,
  min,
  max,
  onPress,
  onSpeed,
  walkLabel = 'Marche',
}: Props) {
  const [down, setDown] = useState<Key | null>(null);
  const expanded = useContext(FrameModeContext);
  // Dernières valeurs, lues par l'écouteur de clavier sans le réinstaller à chaque rendu.
  const live = useRef({ disabled, onPress });
  useEffect(() => {
    live.current = { disabled, onPress };
  });

  // En mode large ou en plein écran, les flèches commandent la marche sans focus préalable,
  // sauf dans un champ de saisie ou un curseur. Touches non imprimables : pas de raccourci à
  // caractère seul (RGAA 12.10).
  useEffect(() => {
    if (!expanded) return;
    const onDoc = (e: KeyboardEvent) => {
      const k = ARROWS[e.key];
      const t = e.target;
      if (!k || live.current.disabled || e.defaultPrevented) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (t instanceof HTMLElement && t.closest('input, textarea, select, [contenteditable]'))
        return;
      e.preventDefault();
      e.stopPropagation();
      setDown(k);
      live.current.onPress(k);
    };
    document.addEventListener('keydown', onDoc, true);
    return () => document.removeEventListener('keydown', onDoc, true);
  }, [expanded]);

  useEffect(() => {
    const clear = () => setDown(null);
    document.addEventListener('keyup', clear);
    window.addEventListener('blur', clear);
    return () => {
      document.removeEventListener('keyup', clear);
      window.removeEventListener('blur', clear);
    };
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const k = ARROWS[e.key];
    if (k && !disabled) {
      e.preventDefault();
      setDown(k);
      onPress(k);
    }
  };

  const keycap = (k: Key, content: React.ReactNode, cls = '') => (
    <button
      key={k}
      type="button"
      aria-label={LABEL[k]}
      className={`kb ${cls} ${down === k ? 'down' : ''}`}
      disabled={disabled}
      onKeyDown={onKeyDown}
      onClick={() => onPress(k)}
    >
      <span className="kb-top" aria-hidden="true">
        {content}
      </span>
    </button>
  );

  return (
    <div className="ctl">
      <div className="ctl-poses" role="group" aria-label="Pose">
        {poses.map((p) => keycap(p, LABEL[p], 'wide'))}
      </div>
      <div className="ctl-walk" role="group" aria-label={walkLabel}>
        {keycap('forward', GLYPH.forward, 'k-up')}
        {keycap('left', GLYPH.left, 'k-left')}
        {keycap('backward', GLYPH.backward, 'k-down')}
        {keycap('right', GLYPH.right, 'k-right')}
      </div>
      <div className="ctl-speed">
        <span className="kb-val" aria-hidden="true">
          {speed}
        </span>
        <input
          type="range"
          aria-label={`Vitesse, plage ${min} à ${max}`}
          min={min}
          max={max}
          step={5}
          value={speed}
          disabled={disabled}
          onChange={(e) => onSpeed(Number(e.target.value))}
        />
        {disabled && gate && (
          <span className="ctl-gate" role="status">
            {gate}
          </span>
        )}
      </div>
    </div>
  );
}
