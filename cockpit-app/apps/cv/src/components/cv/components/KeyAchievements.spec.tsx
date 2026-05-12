import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { KeyAchievements } from './KeyAchievements';
import type { Achievement } from './KeyAchievements';

const achievements: Achievement[] = [
  { title: 'Reduced load time by 40%', description: 'Optimised bundle splitting.' },
];

describe('KeyAchievements', () => {
  it('renders the section title', () => {
    render(<KeyAchievements achievements={achievements} />);
    expect(screen.getByText('KEY ACHIEVEMENTS')).toBeInTheDocument();
  });

  it('renders achievement title and description', () => {
    render(<KeyAchievements achievements={achievements} />);
    expect(screen.getByText('Reduced load time by 40%')).toBeInTheDocument();
    expect(screen.getByText('Optimised bundle splitting.')).toBeInTheDocument();
  });

  it('renders nothing in the list when achievements array is empty', () => {
    render(<KeyAchievements achievements={[]} />);
    expect(screen.queryByRole('heading', { level: 4 })).not.toBeInTheDocument();
  });
});
