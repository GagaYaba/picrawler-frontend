import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';

beforeEach(() => {
  window.location.hash = '';
});

describe('navigation', () => {
  it('marks the section matching the URL hash as current', () => {
    window.location.hash = '#plan';
    render(<App />);
    expect(screen.getByRole('link', { name: 'Plan & Montage' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Simulation' })).not.toHaveAttribute('aria-current');
  });

  it('falls back to the simulation for an unknown hash', () => {
    window.location.hash = '#inconnu';
    render(<App />);
    expect(screen.getByRole('link', { name: 'Simulation' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('exposes skip links to the content and to the emergency stop', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: 'Aller au contenu' })).toHaveAttribute('href', '#main');
    expect(screen.getByRole('link', { name: /arrêt d'urgence/ })).toHaveAttribute('href', '#estop');
  });
});

describe('emergency stop', () => {
  it('engages on Escape and is not released by a second Escape', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Réarmer' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Réarmer' })).toBeInTheDocument();
  });

  it('is released only by an explicit action on the button', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: "Arrêt d'urgence" }));
    await user.click(screen.getByRole('button', { name: 'Réarmer' }));
    expect(screen.getByRole('button', { name: "Arrêt d'urgence" })).toBeInTheDocument();
  });

  it('has no single-character keyboard shortcut', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.keyboard('12 ');
    expect(screen.getByRole('button', { name: "Arrêt d'urgence" })).toBeInTheDocument();
  });
});
