
import React from 'react';
import { COLORS } from '../constants';

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
    <div
      className={`relative group select-none transition-transform ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer active:scale-95'} ${className}`}
      onClick={handleClick}
      style={{
        width: '100px',
        height: '87px', // approx 100 * sqrt(3)/2
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
    </div>
  );
};

export default Hexagon;
