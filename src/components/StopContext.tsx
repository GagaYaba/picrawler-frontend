import { createContext, useContext } from 'react';

/** Arrêt d'urgence partagé : les vues en plein écran en reprennent le bouton. */
export type StopControl = { active: boolean; engage: () => void; reset: () => void };

export const StopContext = createContext<StopControl>({
  active: false,
  engage: () => {},
  reset: () => {},
});

export const useStop = () => useContext(StopContext);

/** Vrai quand la vue est en mode large ou en plein écran : les flèches commandent alors le robot. */
export const FrameModeContext = createContext(false);
