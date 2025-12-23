
import React, { useState } from 'react';
import { RANKS } from '../constants';
import { calculateRank } from '../services/puzzleService';

interface ScoreBoardProps {
  score: number;
  totalPossibleScore: number;
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({ score, totalPossibleScore }) => {
  // Use a fallback for totalPossibleScore to avoid division by zero during init
  const safeTotal = totalPossibleScore || 100;
  const percentage = Math.min((score / safeTotal) * 100, 100);
  const [showNextLevelTooltip, setShowNextLevelTooltip] = useState<boolean>(false);

  // Use shared logic for current rank
  const currentRank = calculateRank(score, safeTotal);

  // Calculate points needed for next level
  let nextLevelPoints: number | null = null;

  // Find the next rank threshold higher than current score
  for (let i = 0; i < RANKS.length; i++) {
    const req = Math.ceil((RANKS[i].minScore / 100) * safeTotal);
    if (req > score) {
      nextLevelPoints = req;
      break;
    }
  }

  return (
    <div className="w-full max-w-md mx-auto px-2 py-2">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg md:text-xl text-gray-800">{currentRank}</span>

          {/* Dots Container - Single Tooltip for Next Level */}
          <div
            className="flex gap-1.5 relative group cursor-default"
            onMouseEnter={() => setShowNextLevelTooltip(true)}
            onMouseLeave={() => setShowNextLevelTooltip(false)}
            onTouchStart={() => setShowNextLevelTooltip(true)}
            onTouchEnd={() => setTimeout(() => setShowNextLevelTooltip(false), 2000)}
          >
            {RANKS.map((rank, i) => {
               // Only show dots for ranks > 0 (Beginner is implicit start) or if you want all dots
               if (i === 0) return null; // Skip beginner dot if desired, or keep it.

               const req = (rank.minScore / 100) * safeTotal;
               return (
                 <div
                   key={i}
                   className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${score >= req ? 'bg-yellow-400' : 'bg-gray-200'}`}
                   title={`${rank.name}: ${Math.ceil(req)}`}
                 />
               );
            })}

            {/* Next Level Tooltip */}
            {showNextLevelTooltip && nextLevelPoints !== null && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap z-30 shadow-lg after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-black">
                Наредно ниво {nextLevelPoints}
              </div>
            )}
          </div>
        </div>
        <div className="text-sm font-bold text-gray-400">
          Поени: <span className="text-black text-base">{score}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
        <div
          className="h-full bg-yellow-400 transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ScoreBoard;
