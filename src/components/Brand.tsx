import { BADGE_SVG, WORDMARK_SVG } from './brandSvg';

/** Logo de la console : contenu SVG statique de la charte, sans donnée externe. */
export function Brand() {
  return (
    <a className="brand" href="#simulation" aria-label="PiCrawler : revenir à la simulation">
      <span className="badge" dangerouslySetInnerHTML={{ __html: BADGE_SVG }} />
      <span className="wmw">
        <span dangerouslySetInnerHTML={{ __html: WORDMARK_SVG }} />
        <span className="sub">Console de pilotage</span>
      </span>
    </a>
  );
}
