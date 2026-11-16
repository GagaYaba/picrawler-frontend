import { useEffect } from 'react';

type Props = { active: boolean; onEngage: () => void; onReset: () => void };

/**
 * Bouton d'arrêt d'urgence. Échap l'enclenche, jamais ne le réarme : le réarmement
 * demande une action volontaire sur le bouton. Aucun raccourci à caractère seul (RGAA 12.10).
 */
export function EmergencyStop({ active, onEngage, onReset }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !active) {
        e.preventDefault();
        onEngage();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active, onEngage]);

  return (
    <button
      id="estop"
      type="button"
      className={active ? 'estop on' : 'estop'}
      aria-keyshortcuts="Escape"
      onClick={active ? onReset : onEngage}
    >
      {active ? 'Réarmer' : "Arrêt d'urgence"}
    </button>
  );
}
