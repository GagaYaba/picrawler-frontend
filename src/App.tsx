import { useCallback, useEffect, useState } from 'react';
import { Brand } from './components/Brand';
import { EmergencyStop } from './components/EmergencyStop';
import { StopContext } from './components/StopContext';
import { useSimulation } from './hooks/useSimulation';
import { PlanView } from './views/PlanView';
import { RealRobotView } from './views/RealRobotView';
import { SimulationView } from './views/SimulationView';
import { VIEWS, viewFromHash } from './viewList';

export function App() {
  const [view, setView] = useState(() => viewFromHash(window.location.hash));
  const [estop, setEstop] = useState(false);
  const sim = useSimulation();
  const { engageStop, resetStop } = sim;
  const engage = useCallback(() => {
    setEstop(true);
    engageStop();
  }, [engageStop]);
  const reset = useCallback(() => {
    setEstop(false);
    resetStop();
  }, [resetStop]);

  useEffect(() => {
    const onHash = () => setView(viewFromHash(window.location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const current = VIEWS.find((v) => v.id === view)!;
  useEffect(() => {
    document.title = `${current.label} · Console PiCrawler`;
  }, [current]);

  return (
    <StopContext.Provider value={{ active: estop, engage, reset }}>
      <a className="skip" href="#main">
        Aller au contenu
      </a>
      <a className="skip" href="#estop" style={{ left: 220 }}>
        Aller à l&apos;arrêt d&apos;urgence
      </a>
      <header className="top pad">
        <Brand />
        <nav className="tabs" aria-label="Sections">
          {VIEWS.map((v) => (
            <a key={v.id} href={`#${v.id}`} aria-current={v.id === view ? 'page' : undefined}>
              {v.label}
            </a>
          ))}
        </nav>
      </header>
      <main id="main" className="pad" tabIndex={-1}>
        {view === 'simulation' ? (
          <SimulationView sim={sim} />
        ) : view === 'robot' ? (
          <RealRobotView sim={sim} />
        ) : (
          <PlanView />
        )}
      </main>
      <footer className="safety pad" aria-label="Sécurité">
        <div className="in">
          <EmergencyStop active={estop} onEngage={engage} onReset={reset} />
          <div className="sstate" role="status">
            {estop ? (
              <>
                <b>Arrêt actif.</b> Mouvements interrompus, robot en position assise.
                <small>Appuyer sur « Réarmer » pour reprendre.</small>
              </>
            ) : (
              <>
                <b>Prêt.</b>{' '}
                {view === 'robot'
                  ? 'Robot réel non joint, commandes simulées.'
                  : 'Simulation active, aucun robot réel piloté.'}
                <small>Échap déclenche l&apos;arrêt d&apos;urgence sur tous les écrans.</small>
              </>
            )}
          </div>
          <span className="link">Paris → Toulouse · 680 km</span>
        </div>
      </footer>
    </StopContext.Provider>
  );
}
