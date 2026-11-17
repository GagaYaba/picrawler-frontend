import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';

beforeEach(() => {
  window.location.hash = '#robot';
});

const pad = () => screen.getByRole('group', { name: 'Marche du robot réel' });

describe('Robot réel screen', () => {
  it('keeps commands disabled until an operator session is open', () => {
    render(<App />);
    expect(screen.getByText('Session requise')).toBeInTheDocument();
    expect(within(pad()).getByRole('button', { name: 'Avancer' })).toBeDisabled();
  });

  it('refuses a token shorter than 32 characters', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText('Jeton opérateur'), 'court');
    await user.click(screen.getByRole('button', { name: 'Ouvrir la session' }));
    expect(screen.getByText(/Jeton trop court/)).toBeInTheDocument();
    expect(screen.getByText('Session requise')).toBeInTheDocument();
  });

  it('opens the commands with a 32-character token and logs a command', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText('Jeton opérateur'), 'a'.repeat(32));
    await user.click(screen.getByRole('button', { name: 'Ouvrir la session' }));
    expect(within(pad()).getByRole('button', { name: 'Avancer' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Debout' }));
    expect(screen.getByText(/Debout$/, { selector: 'li' })).toBeInTheDocument();
  });
});
