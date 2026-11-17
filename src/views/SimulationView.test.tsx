import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';

beforeEach(() => {
  window.location.hash = '#simulation';
});

describe('simulation screen', () => {
  it('logs an accepted command and refuses a second one while the first runs', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Debout' }));
    await user.click(screen.getByRole('button', { name: 'Avancer' }));
    const log = screen.getByRole('list');
    expect(log).toHaveTextContent('Debout');
    expect(log).toHaveTextContent('une commande est déjà en cours');
  });

  it('disables the commands while the emergency stop is active', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Avancer' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Assis' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Réarmer' }));
    expect(screen.getByRole('button', { name: 'Avancer' })).toBeEnabled();
  });

  it('drives the walk pad with the arrow keys only when a pad button has the focus', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('list')).not.toHaveTextContent('Tourner à gauche');
    screen.getByRole('button', { name: 'Gauche' }).focus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('list')).toHaveTextContent('Tourner à gauche');
  });
});
