import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { StreakBadge } from '../components/StreakBadge';

describe('StreakBadge', () => {
  it('renders nothing when streakMode is none', () => {
    const { container } = render(
      <StreakBadge streakMode="none" currentStreak={5} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when currentStreak is 0', () => {
    const { container } = render(
      <StreakBadge streakMode="soft" currentStreak={0} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders streak count for soft streak mode', () => {
    render(<StreakBadge streakMode="soft" currentStreak={3} />);
    const badge = screen.getByTestId('streak-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('3');
  });

  it('renders streak count for hard streak mode', () => {
    render(<StreakBadge streakMode="hard" currentStreak={12} />);
    expect(screen.getByTestId('streak-badge')).toHaveTextContent('12');
  });
});
