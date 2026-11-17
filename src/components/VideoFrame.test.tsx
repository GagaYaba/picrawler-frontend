import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';

beforeEach(() => {
  window.location.hash = '#simulation';
});

describe('video frame', () => {
  it('toggles the wide mode', async () => {
    const user = userEvent.setup();
    render(<App />);
    const wide = screen.getByRole('button', { name: 'Mode large' });
    expect(wide).toHaveAttribute('aria-pressed', 'false');
    await user.click(wide);
    expect(wide).toHaveAttribute('aria-pressed', 'true');
    expect(document.querySelector('.stage')).toHaveClass('wide');
  });

  it('keeps the emergency stop reachable in full screen and the controls usable', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Plein écran' }));
    expect(document.querySelector('.stage')).toHaveClass('immersive');
    const stops = screen.getAllByRole('button', { name: "Arrêt d'urgence" });
    expect(stops).toHaveLength(2);
    await user.click(stops[1]);
    expect(screen.getAllByRole('button', { name: 'Réarmer' })).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Avancer' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Quitter le plein écran' }));
    expect(document.querySelector('.stage')).not.toHaveClass('immersive');
  });
});

describe('arrow keys in an expanded view', () => {
  it('drives the robot without focusing a key first, only in wide or full mode', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.keyboard('{ArrowUp}');
    expect(screen.queryByText(/Avancer · vitesse/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Mode large' }));
    (document.activeElement as HTMLElement | null)?.blur();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByText(/Avancer · vitesse 40/)).toBeInTheDocument();
  });

  it('leaves the arrows to the speed slider when it has the focus', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Mode large' }));
    screen.getByRole('slider').focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.queryByText(/Tourner à droite/)).not.toBeInTheDocument();
  });
});
