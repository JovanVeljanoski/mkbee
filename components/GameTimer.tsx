
import React from 'react';

interface GameTimerProps {
  timeLeft: number;
  isGameOver: boolean;
  timeBonus?: number | null; // For "+X" animation
}

const GameTimer: React.FC<GameTimerProps> = ({ timeLeft, isGameOver, timeBonus }) => {
  // Format time as MM:SS
  const safeTimeLeft = Math.max(0, timeLeft);
  const minutes = Math.floor(safeTimeLeft / 60);
  const seconds = safeTimeLeft % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Determine color based on time remaining
  const isLowTime = timeLeft <= 10 && !isGameOver;
  const isComplete = isGameOver || timeLeft === 0;
  const showBonusPulse = timeBonus !== null && timeBonus !== undefined;

  return (
    <div className="flex items-center justify-center relative">
      <div
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono font-bold text-sm
          transition-all duration-300
          ${isComplete
            ? 'bg-gray-100 text-gray-500'
            : isLowTime
              ? 'bg-red-100 text-red-600 animate-pulse'
              : showBonusPulse
                ? 'bg-yellow-300 text-yellow-800'
                : 'bg-yellow-100 text-yellow-700'
          }
        `}
        style={{
          animation: showBonusPulse ? 'timerPulse 0.5s ease-out' : undefined
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 ${isLowTime && !isComplete ? 'animate-bounce' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="tabular-nums">{formattedTime}</span>
      </div>

      {/* Time bonus floating animation */}
      {showBonusPulse && (
        <div
          className="absolute -top-1 right-0 text-yellow-600 font-bold text-sm pointer-events-none"
          style={{
            animation: 'floatUp 1s ease-out forwards'
          }}
        >
          +{timeBonus}
        </div>
      )}
    </div>
  );
};

export default GameTimer;
