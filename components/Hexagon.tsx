
import React from 'react';
import { COLORS } from '../constants';

interface HexagonProps {
  letter: string;
  isCenter?: boolean;
  onClick: (letter: string) => void;
  className?: string;
  isShuffling?: boolean;
}

const Hexagon: React.FC<HexagonProps> = ({ letter, isCenter, onClick, className = "", isShuffling }) => {
  return (
    <div
      className={`relative group cursor-pointer select-none transition-transform active:scale-95 ${className}`}
      onClick={() => onClick(letter)}
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
