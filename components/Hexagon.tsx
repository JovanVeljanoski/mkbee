import React from 'react';
import { COLORS } from '../constants';

// Hexagon dimensions
const HEXAGON_WIDTH = 100;
const HEXAGON_HEIGHT = 87; // approx width * sqrt(3)/2

interface HexagonProps {
  letter: string;
  isCenter?: boolean;
  onClick: (letter: string) => void;
  className?: string;
  isShuffling?: boolean;
  disabled?: boolean;
}

const Hexagon: React.FC<HexagonProps> = ({ letter, isCenter, onClick, className = "", isShuffling, disabled }) => {
  const handleClick = () => {
    if (!disabled) {
      onClick(letter);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={`Буква ${letter}`}
      className={`relative group select-none transition-transform border-0 bg-transparent p-0 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer active:scale-95'} ${className}`}
      style={{
        width: `${HEXAGON_WIDTH}px`,
        height: `${HEXAGON_HEIGHT}px`,
      }}
    >
      <div
        className="hexagon w-full h-full flex items-center justify-center shadow-sm transition-colors"
        style={{
          backgroundColor: isCenter ? COLORS.yellow : COLORS.lightGray,
        }}
      >
        <span
          className={`text-4xl font-semibold text-black z-10 pointer-events-none uppercase transition-opacity duration-200 ${isShuffling ? 'opacity-0' : 'opacity-100'}`}
          style={{ transform: 'translateY(1px)' }}
        >
          {letter}
        </span>
      </div>
    </button>
  );
};

export default React.memo(Hexagon);
