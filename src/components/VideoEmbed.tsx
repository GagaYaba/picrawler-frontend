import { useState } from 'react';

type Props = {
  title: string;
  embedUrl: string;
  watchUrl: string;
  /** Image d'attente locale : aucune requête vers YouTube avant le clic. */
  poster: string;
  /** Miniatures YouTube à essayer dans l'ordre ; `poster` sert si aucune ne charge. */
  thumbs?: string[];
  /** Titre et chaîne tels que YouTube les déclare (oEmbed). */
  caption?: string;
};

/**
 * `embed` : le lecteur YouTube sans cookies se charge au clic. `link` : certains hébergements
 * (l'aperçu de développement) interdisent tout cadre tiers ; le bouton ouvre alors la vidéo sur
 * YouTube dans un nouvel onglet. Le lien direct reste toujours visible sous la vidéo.
 */
const MODE: 'embed' | 'link' = import.meta.env.VITE_VIDEO_MODE === 'link' ? 'link' : 'embed';

export function VideoEmbed({ title, embedUrl, watchUrl, poster, thumbs = [], caption }: Props) {
  const [on, setOn] = useState(false);
  const [tried, setTried] = useState(0);
  // La miniature vient de YouTube : le navigateur contacte donc YouTube dès l'affichage.
  const remote = MODE === 'embed' ? thumbs[tried] : undefined;
  const playIcon = (
    <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true" focusable="false">
      <path d="M7 4 L20 12 L7 20 Z" fill="currentColor" />
    </svg>
  );
  return (
    <div className="video-wrap">
      <div className="video">
        {on && MODE === 'embed' ? (
          <iframe
            title={title}
            src={`${embedUrl}?autoplay=1&rel=0&playsinline=1`}
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <div className="video-poster">
            <img
              className={remote ? 'video-bg thumb' : 'video-bg'}
              src={remote ?? poster}
              alt=""
              onError={() => remote && setTried((t) => t + 1)}
            />
            {MODE === 'embed' ? (
              <button type="button" className="video-play" onClick={() => setOn(true)}>
                {playIcon}
                <span>Lire la vidéo</span>
              </button>
            ) : (
              <a className="video-play" href={watchUrl} target="_blank" rel="noopener noreferrer">
                {playIcon}
                <span>
                  Lire sur YouTube<span className="sr"> (s&apos;ouvre dans un nouvel onglet)</span>
                </span>
              </a>
            )}
            <p className="video-cap">{caption}</p>
          </div>
        )}
      </div>
    </div>
  );
}
