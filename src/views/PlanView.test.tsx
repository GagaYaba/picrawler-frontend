import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';
import { STEPS } from './planData';

beforeEach(() => {
  window.location.hash = '#plan';
});

describe('Plan & Montage screen', () => {
  it('is reachable from the old montage link and has a single tab', () => {
    window.location.hash = '#montage';
    render(<App />);
    expect(screen.getByRole('link', { name: 'Plan & Montage' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.queryByRole('link', { name: 'Montage' })).not.toBeInTheDocument();
  });

  it('lists the 32 assembly steps in order and filters them by phase', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(STEPS.map((s) => s.n)).toEqual(Array.from({ length: 32 }, (_, i) => i + 1));
    expect(document.querySelectorAll('.step')).toHaveLength(32);
    await user.click(screen.getByRole('button', { name: /Fixation des pattes/ }));
    expect(document.querySelectorAll('.step')).toHaveLength(4);
  });

  it('gives the port of every servo exactly once', () => {
    render(<App />);
    const table = screen.getByRole('table');
    const cells = within(table)
      .getAllByRole('cell')
      .map((c) => c.textContent);
    expect([...cells].sort()).toEqual(Array.from({ length: 12 }, (_, i) => `P${i}`).sort());
  });

  it('loads the video only after a click, from the no-cookie domain', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(document.querySelector('iframe')).toBeNull();
    await user.click(screen.getByRole('button', { name: /Lire la vidéo/ }));
    const frame = document.querySelector('iframe')!;
    expect(frame.getAttribute('src')).toContain('youtube-nocookie.com/embed/vna6QtXPGt4');
    expect(frame).toHaveAttribute('title');
  });

  it('keeps a direct YouTube link visible before and after the click', async () => {
    const user = userEvent.setup();
    render(<App />);
    const link = () => screen.getByRole('link', { name: /Ouvrir sur YouTube/ });
    expect(link()).toHaveAttribute('href', 'https://www.youtube.com/watch?v=vna6QtXPGt4');
    await user.click(screen.getByRole('button', { name: /Lire la vidéo/ }));
    expect(link()).toBeVisible();
  });

  it('shows the SunFounder illustration with a text alternative for every step', () => {
    render(<App />);
    const imgs = [...document.querySelectorAll<HTMLImageElement>('.step-render img')];
    expect(imgs).toHaveLength(32);
    imgs.forEach((i) => {
      expect(i.getAttribute('alt')).toMatch(/étape \d+/i);
      expect(i.getAttribute('src')).toMatch(/plan\/steps\/(s\d\d|\d\d-\d\d)\.webp$/);
    });
  });

  it('switches the step illustrations to the 3D model renders', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Modèle 3D' }));
    const imgs = [...document.querySelectorAll<HTMLImageElement>('.step-render img')];
    expect(imgs).toHaveLength(32);
    imgs.forEach((i) => expect(i.getAttribute('src')).toMatch(/plan\/[A-Za-z0-9]+\.webp$/));
  });

  it('offers one entry point to the original plan, without PDF links or captions', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /Ouvrir le plan d'origine/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /PDF/ })).toBeNull();
    expect(screen.queryByText(/Fig\. 3/)).toBeNull();
    expect(screen.queryByText(/Droits de réutilisation/)).toBeNull();
  });

  it('opens a step on the original plan, with zoom controls, and closes it', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /Étape 7 : agrandir/ }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Étape 7')).toBeInTheDocument();
    expect(within(dialog).getByRole('img', { name: /Page 1/ })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Zoom avant' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Zoom arrière' })).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: "Arrêt d'urgence" })).toBeNull();
    expect(within(dialog).queryByRole('link')).toBeNull();
    await user.click(within(dialog).getByRole('button', { name: 'Page 2' }));
    expect(within(dialog).getByRole('img', { name: /Page 2/ })).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Fermer' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
