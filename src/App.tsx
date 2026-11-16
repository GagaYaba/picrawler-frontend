import { useCallback, useEffect, useState } from 'react';
import { EmergencyStop } from './components/EmergencyStop';
import { VIEWS, viewFromHash } from './views';

export function App() {
  const [view, setView] = useState(() => viewFromHash(window.location.hash));
  const [estop, setEstop] = useState(false);
  const engage = useCallback(() => setEstop(true), []);
  const reset = useCallback(() => setEstop(false), []);

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
    <>
      <a className="skip" href="#main">
        Aller au contenu
      </a>
      <a className="skip" href="#estop" style={{ left: 220 }}>
        Aller à l&apos;arrêt d&apos;urgence
      </a>
      <header className="top pad">
        <a href="#simulation" aria-label="PiCrawler : revenir à la simulation">
          PiCrawler
        </a>
        <nav className="tabs" aria-label="Sections">
          {VIEWS.map((v) => (
            <a key={v.id} href={`#${v.id}`} aria-current={v.id === view ? 'page' : undefined}>
              {v.label}
            </a>
          ))}
        </nav>
      </header>
      <main id="main" className="pad" tabIndex={-1}>
        <h1 className="sec">
          {current.title}
          <span>{current.subtitle}</span>
        </h1>
        <p>Écran en cours de construction.</p>
      </main>
      <footer className="safety pad" aria-label="Sécurité">
        <div className="in">
          <EmergencyStop active={estop} onEngage={engage} onReset={reset} />
          <div role="status">
            {estop ? (
              <>
                <b>Arrêt actif.</b> Appuyer sur « Réarmer » pour reprendre.
              </>
            ) : (
              <>
                <b>Prêt.</b> Échap déclenche l&apos;arrêt d&apos;urgence sur tous les écrans.
              </>
            )}
          </div>
        </div>
      </footer>
    </>
  );
}
