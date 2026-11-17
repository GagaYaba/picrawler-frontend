import { useEffect, useState } from 'react';

/** Télémétrie d'exemple de la maquette : valeurs factices qui varient légèrement. */
export function useDemoTelemetry() {
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
