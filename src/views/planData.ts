/**
 * Contenu du plan de montage SunFounder PiCrawler (planches de juin 2024), redessiné pour
 * l'application. Les textes sont une traduction et une reformulation des légendes du plan ;
 * les schémas isométriques d'origine ne sont pas repris.
 */

export type Picto =
  | 'cable'
  | 'camera'
  | 'standoffs'
  | 'tape'
  | 'battery'
  | 'sensor'
  | 'stack'
  | 'wire'
  | 'board'
  | 'servo'
  | 'arm'
  | 'plate'
  | 'rivet'
  | 'leg'
  | 'robot'
  | 'screw'
  | 'nut'
  | 'washer'
  | 'tool'
  | 'header'
  | 'usb';

export type Plate = { id: string; qty: number; name: string; role: string };
export const PLATES: Plate[] = [
  {
    id: 'A',
    qty: 1,
    name: 'Plaque A',
    role: 'Plaque supérieure : entretoises du Raspberry Pi, batterie, caméra',
  },
  { id: 'B', qty: 1, name: 'Plaque B', role: 'Plaque inférieure : module à ultrasons' },
  { id: 'C', qty: 4, name: 'Plaque C', role: 'Élément de patte, reçoit un bras de servo' },
  { id: 'D', qty: 4, name: 'Plaque D', role: 'Élément de patte, relie les plaques C et E' },
  { id: 'E', qty: 4, name: 'Plaque E', role: 'Élément de patte, reçoit un bras de servo' },
];

export type Part = { name: string; spec?: string; picto: Picto; qty?: string };

export const FASTENERS: Part[] = [
  { name: 'Vis', spec: 'M1.4 × 6', picto: 'screw' },
  { name: 'Écrou', spec: 'M1.4', picto: 'nut' },
  { name: 'Vis autotaraudeuse', spec: 'M1.5 × 4', picto: 'screw' },
  { name: 'Vis', spec: 'M2 × 10', picto: 'screw' },
  { name: 'Vis', spec: 'M2 × 4', picto: 'screw' },
  { name: 'Vis', spec: 'M2.5 × 6', picto: 'screw' },
  { name: 'Vis', spec: 'M3 × 6', picto: 'screw' },
  { name: 'Rondelle métal', picto: 'washer' },
  { name: 'Rivet', spec: 'R3065', picto: 'rivet' },
  { name: 'Entretoise', spec: 'M2.5 × 11', picto: 'standoffs' },
  { name: 'Entretoise', spec: 'M2.5 × 18 + 6', picto: 'standoffs' },
  { name: 'Entretoise', spec: 'M3 × 24', picto: 'standoffs' },
  { name: 'Entretoise', spec: 'M2.5 × 30', picto: 'standoffs' },
];

export const OTHER_PARTS: Part[] = [
  { name: 'Servomoteur', picto: 'servo', qty: '× 12' },
  { name: 'Robot HAT', picto: 'board' },
  { name: 'Batterie', picto: 'battery' },
  { name: 'Module à ultrasons', picto: 'sensor' },
  { name: 'Module caméra', picto: 'camera' },
  { name: 'Câble FPC', picto: 'cable' },
  { name: 'Câble FFC', picto: 'cable' },
  { name: 'Câble 4 broches', picto: 'wire' },
  { name: 'Câble USB-C', picto: 'usb' },
  { name: 'Embase 40 broches', picto: 'header' },
  { name: 'Bande auto-agrippante', picto: 'tape' },
  { name: 'Serre-câbles', picto: 'tape' },
  { name: 'Tournevis', picto: 'tool' },
  { name: 'Clé à douille', picto: 'tool' },
];

export type Phase = 'chassis' | 'pattes' | 'fixation';
export const PHASES: { id: Phase; title: string; range: string }[] = [
  { id: 'chassis', title: 'Châssis et électronique', range: 'Étapes 1 à 12' },
  { id: 'pattes', title: 'Servos et pattes', range: 'Étapes 13 à 28' },
  { id: 'fixation', title: 'Fixation des pattes', range: 'Étapes 29 à 32' },
];

export type Step = {
  n: number;
  phase: Phase;
  title: string;
  text: string;
  parts: string[];
  picto: Picto;
  note?: string;
};

export const ZEROING_NOTE =
  'Avant de poser la vis d’un servo, le mettre à zéro en suivant la procédure « Servo Zeroing for Assembly » de la documentation SunFounder.';

export const STEPS: Step[] = [
  {
    n: 1,
    phase: 'chassis',
    title: 'Câble de la caméra sur le Raspberry Pi',
    text: 'Soulever le verrou du connecteur caméra, insérer le câble, rabattre le verrou. Le Raspberry Pi 4 utilise le câble FFC ; les Raspberry Pi 5 et Pi Zero 2 W utilisent le câble FPC.',
    parts: ['Câble FFC', 'Raspberry Pi 4'],
    picto: 'cable',
  },
  {
    n: 2,
    phase: 'chassis',
    title: 'Câble sur le module caméra',
    text: 'Tirer le verrou vers le bas, insérer le câble, repousser le verrou. Respecter le sens : le côté plastique du câble est repéré sur le schéma d’origine.',
    parts: ['Module caméra', 'Câble FFC'],
    picto: 'camera',
  },
  {
    n: 3,
    phase: 'chassis',
    title: 'Entretoises sur la plaque A',
    text: 'Visser les entretoises sur la plaque A. Raspberry Pi 4 ou 5 : entretoises M2.5 × 18 + 6. Pi Zero 2 W : entretoises M2.5 × 18 + 6 et M2.5 × 30. Vis M2.5 × 6 sous la plaque.',
    parts: ['Entretoise M2.5 × 18 + 6', 'Vis M2.5 × 6', 'Plaque A'],
    picto: 'standoffs',
  },
  {
    n: 4,
    phase: 'chassis',
    title: 'Bande auto-agrippante',
    text: 'Coller la bande auto-agrippante sur la plaque A, à l’emplacement de la batterie, et la face correspondante sur la batterie.',
    parts: ['Bande auto-agrippante', 'Plaque A', 'Batterie'],
    picto: 'tape',
  },
  {
    n: 5,
    phase: 'chassis',
    title: 'Batterie sur la plaque A',
    text: 'Poser la batterie sur la bande auto-agrippante de la plaque A, fil vers l’arrière.',
    parts: ['Batterie', 'Plaque A'],
    picto: 'battery',
  },
  {
    n: 6,
    phase: 'chassis',
    title: 'Module à ultrasons sur la plaque B',
    text: 'Fixer le module à ultrasons dans l’ouverture de la plaque B avec quatre vis M1.4 × 6 et quatre écrous M1.4.',
    parts: ['Module à ultrasons', 'Vis M1.4 × 6', 'Écrou M1.4', 'Plaque B'],
    picto: 'sensor',
  },
  {
    n: 7,
    phase: 'chassis',
    title: 'Assembler les plaques A et B',
    text: 'Relier les plaques A et B par les entretoises M3 × 24, avec des vis M3 × 6 de chaque côté.',
    parts: ['Entretoise M3 × 24', 'Vis M3 × 6', 'Plaque A', 'Plaque B'],
    picto: 'stack',
  },
  {
    n: 8,
    phase: 'chassis',
    title: 'Câble du module à ultrasons',
    text: 'Brancher le câble 4 broches sur le module à ultrasons.',
    parts: ['Câble 4 broches'],
    picto: 'wire',
  },
  {
    n: 9,
    phase: 'chassis',
    title: 'Caméra sur la plaque A',
    text: 'Fixer le module caméra sur le support de la plaque A avec des vis M2 × 4, le câble passant vers le bas.',
    parts: ['Module caméra', 'Vis M2 × 4'],
    picto: 'camera',
  },
  {
    n: 10,
    phase: 'chassis',
    title: 'Raspberry Pi et Robot HAT',
    text: 'Raspberry Pi 4 ou 5 : poser la carte sur les entretoises M2.5 × 30, enfoncer l’embase 40 broches, puis poser le Robot HAT avec des vis M2.5 × 6. Pi Zero 2 W : entretoises M2.5 × 11 puis Robot HAT.',
    parts: [
      'Raspberry Pi 4',
      'Entretoise M2.5 × 30',
      'Embase 40 broches',
      'Robot HAT',
      'Vis M2.5 × 6',
    ],
    picto: 'board',
  },
  {
    n: 11,
    phase: 'chassis',
    title: 'Câble de la batterie',
    text: 'Brancher le câble de la batterie sur le Robot HAT.',
    parts: ['Robot HAT', 'Batterie'],
    picto: 'battery',
  },
  {
    n: 12,
    phase: 'chassis',
    title: 'Servo à l’avant',
    text: 'Fixer un servo à l’avant, près du module à ultrasons, avec des vis M2 × 4.',
    parts: ['Servomoteur', 'Vis M2 × 4'],
    picto: 'servo',
  },
  {
    n: 13,
    phase: 'pattes',
    title: 'Servos aux angles du châssis',
    text: 'Placer les quatre servos de hanche aux angles du châssis, axe de sortie vers l’extérieur.',
    parts: ['Servomoteur × 4'],
    picto: 'servo',
  },
  {
    n: 14,
    phase: 'pattes',
    title: 'Bras de servo sur la plaque E',
    text: 'Fixer un bras de servo sur la plaque E avec deux vis autotaraudeuses M1.5 × 4.',
    parts: ['Plaque E', 'Bras de servo', 'Vis M1.5 × 4'],
    picto: 'arm',
  },
  {
    n: 15,
    phase: 'pattes',
    title: 'Quatre plaques E équipées',
    text: 'Répéter l’étape 14 pour obtenir quatre plaques E munies de leur bras de servo.',
    parts: ['Plaque E × 4'],
    picto: 'plate',
  },
  {
    n: 16,
    phase: 'pattes',
    title: 'Bras de servo sur la plaque C',
    text: 'Fixer un bras de servo sur la plaque C avec deux vis autotaraudeuses M1.5 × 4.',
    parts: ['Plaque C', 'Bras de servo', 'Vis M1.5 × 4'],
    picto: 'arm',
  },
  {
    n: 17,
    phase: 'pattes',
    title: 'Plaque C, autre face',
    text: 'Même fixation sur l’autre face de la plaque C, avec deux vis M1.5 × 4.',
    parts: ['Plaque C', 'Vis M1.5 × 4'],
    picto: 'arm',
  },
  {
    n: 18,
    phase: 'pattes',
    title: 'Quatre plaques C équipées',
    text: 'Répéter les étapes 16 et 17 pour obtenir quatre plaques C équipées.',
    parts: ['Plaque C × 4'],
    picto: 'plate',
  },
  {
    n: 19,
    phase: 'pattes',
    title: 'Deux servos sur la plaque C',
    text: 'Placer deux servos sur la plaque C, fils orientés comme sur le schéma d’origine.',
    parts: ['Servomoteur × 2', 'Plaque C'],
    picto: 'servo',
  },
  {
    n: 20,
    phase: 'pattes',
    title: 'Plaque D sur la plaque C',
    text: 'Poser la plaque D sur la plaque C et la fixer avec un rivet et une rondelle métal : insérer, pousser, verrouiller.',
    parts: ['Plaque D', 'Rivet R3065', 'Rondelle métal'],
    picto: 'rivet',
  },
  {
    n: 21,
    phase: 'pattes',
    title: 'Servo sur P11, mise à zéro',
    text: 'Brancher le servo sur le port P11 du Robot HAT et le mettre à zéro.',
    parts: ['Robot HAT', 'Servomoteur'],
    picto: 'servo',
    note: ZEROING_NOTE,
  },
  {
    n: 22,
    phase: 'pattes',
    title: 'Servo à 90°',
    text: 'Placer le servo à 90° dans la plaque et poser la vis de servo, la plus petite du sachet.',
    parts: ['Servomoteur', 'Vis de servo'],
    picto: 'servo',
  },
  {
    n: 23,
    phase: 'pattes',
    title: 'Vis de fixation du servo',
    text: 'Fixer le servo avec les vis M2 × 10.',
    parts: ['Vis M2 × 10'],
    picto: 'screw',
  },
  {
    n: 24,
    phase: 'pattes',
    title: 'Plaque E sur la plaque D',
    text: 'Assembler la plaque E sur la plaque D avec un rivet et une rondelle métal.',
    parts: ['Plaque E', 'Plaque D', 'Rivet R3065', 'Rondelle métal'],
    picto: 'rivet',
  },
  {
    n: 25,
    phase: 'pattes',
    title: 'Servo sur P11, mise à zéro',
    text: 'Brancher le servo suivant sur P11 et le mettre à zéro.',
    parts: ['Robot HAT', 'Servomoteur'],
    picto: 'servo',
    note: ZEROING_NOTE,
  },
  {
    n: 26,
    phase: 'pattes',
    title: 'Servo du bas à 90°',
    text: 'Placer le servo F à 90° et poser sa vis de servo, la plus petite du sachet.',
    parts: ['Servomoteur', 'Vis de servo'],
    picto: 'servo',
  },
  {
    n: 27,
    phase: 'pattes',
    title: 'Vis de fixation du servo',
    text: 'Fixer le servo F avec les vis M2 × 10.',
    parts: ['Vis M2 × 10'],
    picto: 'screw',
  },
  {
    n: 28,
    phase: 'pattes',
    title: 'Quatre pattes assemblées',
    text: 'Répéter les étapes 19 à 27 pour obtenir quatre pattes identiques.',
    parts: ['Patte × 4'],
    picto: 'leg',
  },
  {
    n: 29,
    phase: 'fixation',
    title: 'Servo sur P11, mise à zéro',
    text: 'Brancher le servo de hanche sur P11 et le mettre à zéro avant de fixer la patte.',
    parts: ['Robot HAT', 'Servomoteur'],
    picto: 'servo',
    note: ZEROING_NOTE,
  },
  {
    n: 30,
    phase: 'fixation',
    title: 'Patte sur le servo de hanche',
    text: 'Placer la patte sur le bras du servo de hanche et la fixer avec un rivet et une rondelle métal.',
    parts: ['Patte', 'Rivet R3065', 'Rondelle métal'],
    picto: 'rivet',
  },
  {
    n: 31,
    phase: 'fixation',
    title: 'Vis du servo de hanche',
    text: 'Poser la vis de servo, la plus petite du sachet, avec la patte à 45° par rapport à l’axe du robot. Répéter pour les quatre pattes.',
    parts: ['Vis de servo', 'Patte × 4'],
    picto: 'screw',
  },
  {
    n: 32,
    phase: 'fixation',
    title: 'Robot assemblé',
    text: 'Les quatre pattes sont en place. Passer au câblage, puis à l’étalonnage.',
    parts: [],
    picto: 'robot',
  },
];

/** Ports du Robot HAT par patte, vue du dessus, avant en haut (numérotation de l'assistant d'étalonnage). */
export type LegPorts = { leg: number; side: string; ports: [number, number, number] };
export const LEG_PORTS: LegPorts[] = [
  { leg: 1, side: 'avant droite', ports: [9, 10, 11] },
  { leg: 2, side: 'avant gauche', ports: [3, 4, 5] },
  { leg: 3, side: 'arrière gauche', ports: [0, 1, 2] },
  { leg: 4, side: 'arrière droite', ports: [6, 7, 8] },
];
export const JOINTS = ['hanche', 'cuisse', 'pied'] as const;

export const VIDEO = {
  id: 'vna6QtXPGt4',
  watch: 'https://www.youtube.com/watch?v=vna6QtXPGt4',
  embed: 'https://www.youtube-nocookie.com/embed/vna6QtXPGt4',
  thumbs: [
    'https://i.ytimg.com/vi/vna6QtXPGt4/maxresdefault.jpg',
    'https://i.ytimg.com/vi/vna6QtXPGt4/hqdefault.jpg',
  ],
};

/**
 * Rendu 3D de l'étape, tiré du modèle du robot (public/plan/*.webp). Plusieurs étapes voisines
 * partagent la même image. Le modèle est simplifié : ni vis ni fils, et les plaques A à E sont
 * repérées par leur position.
 */
const STEP_IMAGES: Record<number, { file: string; alt: string }> = {
  1: { file: 'pcb', alt: 'Carte Raspberry Pi 4' },
  2: { file: 'cam', alt: 'Module caméra sur sa plaque' },
  3: { file: 'plateA', alt: 'Plaque A avec ses entretoises' },
  4: { file: 'battery', alt: 'Support de batterie fixé sous la plaque' },
  5: { file: 'battery', alt: 'Support de batterie fixé sous la plaque' },
  6: { file: 'plateB', alt: 'Plaque B avec le capteur ultrason' },
  7: { file: 'stack', alt: 'Plaque B posée sur la plaque A' },
  8: { file: 'stack', alt: 'Plaque B posée sur la plaque A' },
  9: { file: 'stackcam', alt: 'Caméra fixée sur le châssis' },
  10: { file: 'hat', alt: 'Robot HAT et Raspberry Pi posés sur le châssis' },
  11: { file: 'body', alt: 'Corps du robot terminé' },
  12: { file: 'servos', alt: 'Servos posés sur le corps du robot' },
  13: { file: 'servos', alt: 'Servos posés sur le corps du robot' },
  14: { file: 'E', alt: 'Pièce E de la patte' },
  15: { file: 'Erow', alt: 'Quatre pièces E alignées' },
  16: { file: 'C', alt: 'Pièce C de la patte' },
  17: { file: 'C', alt: 'Pièce C de la patte' },
  18: { file: 'Crow', alt: 'Quatre pièces C alignées' },
  19: { file: 'Cservos', alt: 'Pièce C avec son servo' },
  20: { file: 'CD', alt: 'Pièces C et D assemblées' },
  21: { file: 'CD', alt: 'Pièces C et D assemblées' },
  22: { file: 'CD', alt: 'Pièces C et D assemblées' },
  23: { file: 'CD', alt: 'Pièces C et D assemblées' },
  24: { file: 'leg', alt: 'Patte assemblée' },
  25: { file: 'leg', alt: 'Patte assemblée' },
  26: { file: 'leg', alt: 'Patte assemblée' },
  27: { file: 'leg', alt: 'Patte assemblée' },
  28: { file: 'legs', alt: 'Les quatre pattes assemblées' },
  29: { file: 'robot1', alt: 'Première patte fixée au corps' },
  30: { file: 'robot1', alt: 'Première patte fixée au corps' },
  31: { file: 'robot1', alt: 'Première patte fixée au corps' },
  32: { file: 'robot', alt: 'Robot complet avec ses quatre pattes' },
};

/** Image de rendu de l'étape `n`, ou `undefined` si aucune. */
export function stepImage(n: number, base: string): { src: string; alt: string } | undefined {
  const i = STEP_IMAGES[n];
  return i ? { src: `${base}plan/${i.file}.webp`, alt: i.alt } : undefined;
}

/**
 * Plan d'assemblage SunFounder (PDF de juin 2024, 2 pages), stocké dans l'application. Les
 * pages sont aussi fournies en images (public/plan/pages) pour la visionneuse à zoom, et chaque
 * étape en détourage (public/plan/steps). Les zones sont en fractions de la page (0 à 1).
 */
export const PLAN_PDF = {
  file: 'plan/PiCrawler-Assembly-plan.pdf',
  pages: ['plan/pages/plan-p1.webp', 'plan/pages/plan-p2.webp'],
  title: 'Plan d’assemblage SunFounder PiCrawler (juin 2024)',
  size: '13 Mo',
} as const;

export type PlanRegion = { page: 1 | 2; x: number; y: number; w: number; h: number };

const REGIONS: Record<string, PlanRegion> = {
  1: { page: 1, x: 0.3448, y: 0.3096, w: 0.1557, h: 0.1913 },
  2: { page: 1, x: 0.3477, y: 0.7556, w: 0.1417, h: 0.1987 },
  3: { page: 1, x: 0.5102, y: 0.0148, w: 0.1528, h: 0.2214 },
  4: { page: 1, x: 0.5139, y: 0.4472, w: 0.1479, h: 0.1966 },
  5: { page: 1, x: 0.5139, y: 0.6439, w: 0.1343, h: 0.1381 },
  6: { page: 1, x: 0.5139, y: 0.8071, w: 0.1399, h: 0.1385 },
  7: { page: 1, x: 0.6777, y: 0.0148, w: 0.1617, h: 0.2754 },
  8: { page: 1, x: 0.6777, y: 0.2902, w: 0.1617, h: 0.136 },
  9: { page: 1, x: 0.6777, y: 0.4262, w: 0.1617, h: 0.1253 },
  10: { page: 1, x: 0.8367, y: 0.0148, w: 0.1615, h: 0.6439 },
  11: { page: 1, x: 0.8381, y: 0.6575, w: 0.1602, h: 0.1327 },
  12: { page: 1, x: 0.8381, y: 0.7902, w: 0.1602, h: 0.1921 },
  13: { page: 2, x: 0.0091, y: 0.0284, w: 0.151, h: 0.2799 },
  14: { page: 2, x: 0.0113, y: 0.3021, w: 0.123, h: 0.1785 },
  15: { page: 2, x: 0.0113, y: 0.4852, w: 0.1656, h: 0.1373 },
  16: { page: 2, x: 0.0107, y: 0.6224, w: 0.0807, h: 0.1735 },
  17: { page: 2, x: 0.1018, y: 0.6224, w: 0.0863, h: 0.1657 },
  18: { page: 2, x: 0.0107, y: 0.7993, w: 0.1732, h: 0.1904 },
  19: { page: 2, x: 0.1866, y: 0.0272, w: 0.144, h: 0.2502 },
  20: { page: 2, x: 0.1866, y: 0.2811, w: 0.1413, h: 0.2585 },
  21: { page: 2, x: 0.1839, y: 0.5499, w: 0.1467, h: 0.1529 },
  '22-23': { page: 2, x: 0.1831, y: 0.7119, w: 0.1475, h: 0.2778 },
  24: { page: 2, x: 0.3421, y: 0.0272, w: 0.1209, h: 0.1707 },
  25: { page: 2, x: 0.3421, y: 0.2086, w: 0.1518, h: 0.1513 },
  '26-27': { page: 2, x: 0.3421, y: 0.3747, w: 0.1547, h: 0.3207 },
  28: { page: 2, x: 0.3421, y: 0.7102, w: 0.1654, h: 0.2795 },
  29: { page: 2, x: 0.5067, y: 0.0272, w: 0.1483, h: 0.1315 },
  '30-31': { page: 2, x: 0.5067, y: 0.1587, w: 0.1539, h: 0.4617 },
  32: { page: 2, x: 0.5067, y: 0.6331, w: 0.1574, h: 0.3566 },
  pieces: { page: 1, x: 0.0107, y: 0.0227, w: 0.3186, h: 0.9555 },
  cablage: { page: 2, x: 0.6684, y: 0.012, w: 0.3248, h: 0.3656 },
  ultrasons: { page: 2, x: 0.6684, y: 0.3776, w: 0.3258, h: 0.204 },
};

/** Étapes dessinées côte à côte sur le plan : un seul détourage pour les deux. */
const SHARED: Record<number, string> = {
  22: '22-23',
  23: '22-23',
  26: '26-27',
  27: '26-27',
  30: '30-31',
  31: '30-31',
};

/** Détourage de l'étape `n` sur le plan d'origine, et sa zone pour la visionneuse. */
export function planStep(n: number, base: string): { src: string; region: PlanRegion } {
  const key = SHARED[n] ?? String(n);
  const file = SHARED[n] ?? `s${String(n).padStart(2, '0')}`;
  return { src: `${base}plan/steps/${file}.webp`, region: REGIONS[key] };
}

/** Zones générales du plan, pour les sections Pièces et Câblage. */
export const PLAN_AREAS = {
  pieces: REGIONS.pieces,
  cablage: REGIONS.cablage,
  ultrasons: REGIONS.ultrasons,
} as const;
