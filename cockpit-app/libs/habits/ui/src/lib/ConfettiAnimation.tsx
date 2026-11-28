import { useEffect, useState } from 'react';

const CONFETTI_COLORS = [
  '#ff6b6b',
  '#ffd93d',
  '#6bcb77',
  '#4d96ff',
  '#c77dff',
  '#ff9a3c',
];

interface ConfettiPiece {
  id: number;
  color: string;
  left: number;
  animationDuration: number;
  delay: number;
  size: number;
}

function generatePieces(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: Math.random() * 100,
    animationDuration: 1.5 + Math.random() * 1,
    delay: Math.random() * 0.5,
    size: 6 + Math.random() * 6,
  }));
}

interface ConfettiAnimationProps {
  onDone?: () => void;
}

export function ConfettiAnimation({ onDone }: ConfettiAnimationProps) {
  const [pieces] = useState(() => generatePieces(40));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {pieces.map((piece) => (
        <div
          key={piece.id}
          style={{
            position: 'absolute',
            left: `${piece.left}%`,
            top: 0,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animation: `confetti-fall ${piece.animationDuration}s ${piece.delay}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}
