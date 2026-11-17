export const VIEWS = [
  { id: 'simulation', label: 'Simulation', title: 'Simulation', subtitle: 'du robot' },
  { id: 'robot', label: 'Robot réel', title: 'Robot à Paris', subtitle: 'poste à Toulouse' },
  { id: 'plan', label: 'Plan & Montage', title: 'Plan & montage', subtitle: 'du robot' },
] as const;

export type ViewId = (typeof VIEWS)[number]['id'];

/** Anciens liens : le plan et le montage forment un seul écran. */
const ALIASES: Record<string, ViewId> = { montage: 'plan' };

export function viewFromHash(hash: string): ViewId {
  const id = hash.replace(/^#/, '');
  return ALIASES[id] ?? VIEWS.find((v) => v.id === id)?.id ?? 'simulation';
}
