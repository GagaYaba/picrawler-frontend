import { useCallback, useEffect, useRef, useState } from 'react';
import { FrameModeContext, useStop } from './StopContext';

type Props = {
  className: string;
  children: React.ReactNode;
};

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
    <path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
  </svg>
);

/**
 * Cadre de la vue 3D ou de la caméra, avec deux agrandissements comme un lecteur vidéo :
 * « Mode large » (la vue remplit la hauteur de l'écran, la page reste visible) et
 * « Plein écran » (API plein écran du navigateur, ou à défaut un affichage fixe couvrant la
 * fenêtre). En plein écran le pied de page n'est plus visible : l'arrêt d'urgence est donc
 * repris dans la vue. Échap quitte le plein écran du navigateur ; dans l'affichage de repli,
 * il enclenche l'arrêt d'urgence comme partout ailleurs.
 */
export function VideoFrame({ className, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [wide, setWide] = useState(false);
  const [full, setFull] = useState(false);
  const stop = useStop();

  // Les scènes se redimensionnent sur l'événement resize de la fenêtre.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
      if (wide) ref.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(id);
  }, [wide, full]);

  useEffect(() => {
    const sync = () => {
      if (!document.fullscreenElement) setFull(false);
    };
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  const enterFull = useCallback(async () => {
    setFull(true);
    try {
      await ref.current?.requestFullscreen?.();
    } catch {
      // Plein écran refusé (cadre intégré, par exemple) : l'affichage fixe de repli reste actif.
    }
  }, []);

  const exitFull = useCallback(async () => {
    setFull(false);
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        /* déjà quitté */
      }
    }
  }, []);

  return (
    <FrameModeContext.Provider value={wide || full}>
      <div
        ref={ref}
        className={`${className} vframe${wide ? ' wide' : ''}${full ? ' immersive' : ''}`}
      >
        {children}
        <div className="vtools" role="group" aria-label="Taille de la vue">
          {!full && (
            <button
              type="button"
              className="vbtn"
              aria-pressed={wide}
              aria-label="Mode large"
              title="Mode large"
              onClick={() => setWide((w) => !w)}
            >
              <Icon d={wide ? 'M3 8h18v8H3z' : 'M3 5h18v14H3z'} />
            </button>
          )}
          <button
            type="button"
            className="vbtn"
            aria-pressed={full}
            aria-label={full ? 'Quitter le plein écran' : 'Plein écran'}
            title={full ? 'Quitter le plein écran' : 'Plein écran'}
            onClick={() => (full ? exitFull() : enterFull())}
          >
            <Icon
              d={
                full
                  ? 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5'
                  : 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5'
              }
            />
          </button>
        </div>
        {full && (
          <button
            type="button"
            className={stop.active ? 'estop on vstop' : 'estop vstop'}
            onClick={stop.active ? stop.reset : stop.engage}
          >
            {stop.active ? 'Réarmer' : "Arrêt d'urgence"}
          </button>
        )}
      </div>
    </FrameModeContext.Provider>
  );
}
