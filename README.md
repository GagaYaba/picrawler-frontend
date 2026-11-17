# picrawler-frontend

Console web de pilotage du PiCrawler (React, TypeScript, Vite). Elle reprend la maquette « Console PiCrawler » et la « Charte PiCrawler » du projet, et vise le RGAA 4.1.2 (niveau AA).

État : squelette (navigation, arrêt d'urgence local, jetons de la charte). Les écrans et le lien avec l'API du backend restent à réaliser.

## Installation et lancement

```bash
npm ci
cp .env.template .env   # adapter VITE_API_URL
npm run dev
```

## Vérifications

```bash
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
```

## Accessibilité

- Aucun raccourci clavier à caractère seul. Échap enclenche l'arrêt d'urgence, il ne le réarme jamais.
- Liens d'évitement vers le contenu et vers l'arrêt d'urgence.
- ESLint avec `jsx-a11y` pour détecter les défauts de base ; ne remplace pas un audit RGAA `[À RÉALISER]`.
