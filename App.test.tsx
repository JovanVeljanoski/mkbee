import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  beforeEach(() => {
    localStorage.clear();
    // No network in tests: dictionary loading will fail gracefully and the app
    // should fall back to showing the welcome screen without a puzzle.
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('no network in tests')));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders the welcome screen without crashing', async () => {
    render(<App />);
    expect(
      await screen.findByRole('heading', { name: 'Македонска пчелка' })
    ).toBeInTheDocument();
  });

  it('navigates past the welcome screen when the play button is clicked', async () => {
    render(<App />);

    const playButton = await screen.findByRole('button', { name: /Играј|Вчитувам/ });
    fireEvent.click(playButton);

    // Without a loaded puzzle the main game layout still renders its header
    const headers = await screen.findAllByText('Македонска пчелка');
    expect(headers.length).toBeGreaterThan(0);
  });
});
