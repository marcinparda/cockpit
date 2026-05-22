import { Flame } from 'lucide-react';

interface StreakBadgeProps {
  streakMode: 'none' | 'soft' | 'hard';
  currentStreak: number;
}

export function StreakBadge({ streakMode, currentStreak }: StreakBadgeProps) {
  if (streakMode === 'none' || currentStreak === 0) {
    return null;
  }

  return (
    <span
      data-testid="streak-badge"
      className="absolute -right-1 -top-1 flex items-center gap-0.5 rounded-full bg-orange-500 px-1 py-0.5 text-[10px] font-bold text-white"
    >
      <Flame size={10} aria-hidden="true" />
      {currentStreak}
    </span>
  );
}
