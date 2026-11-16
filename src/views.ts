export const VIEWS = [
  { id: 'simulation', label: 'Simulation', title: 'Simulation', subtitle: 'du robot' },
  { id: 'robot', label: 'Robot réel', title: 'Robot à Paris', subtitle: 'poste à Toulouse' },
  { id: 'plan', label: 'Plan', title: 'Plan', subtitle: 'du robot' },
  { id: 'montage', label: 'Montage', title: 'Montage', subtitle: 'en trois temps' },
] as const;

export type ViewId = (typeof VIEWS)[number]['id'];

export function viewFromHash(hash: string): ViewId {
  const id = hash.replace(/^#/, '');
  return VIEWS.find((v) => v.id === id)?.id ?? 'simulation';
}
