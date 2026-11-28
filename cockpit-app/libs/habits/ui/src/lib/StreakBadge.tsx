interface StreakBadgeProps {
  streakMode: 'none' | 'soft' | 'hard';
  currentStreak: number;
}

/** Inline "🔥 N" pill; hidden when streaks are off or the streak is 0. */
export function StreakBadge({ streakMode, currentStreak }: StreakBadgeProps) {
  if (streakMode === 'none' || currentStreak === 0) {
    return null;
  }

  return (
    <span
      data-testid="streak-badge"
      role="img"
      aria-label={`${currentStreak} day streak`}
      className="rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white"
    >
      🔥 {currentStreak}
    </span>
  );
}
