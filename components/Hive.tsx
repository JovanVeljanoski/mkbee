
import React from 'react';
import Hexagon from './Hexagon';

interface HiveProps {
  centerLetter: string;
  outerLetters: string[];
  onLetterClick: (letter: string) => void;
  isShuffling?: boolean;
  disabled?: boolean;
}

const Hive: React.FC<HiveProps> = ({ centerLetter, outerLetters, onLetterClick, isShuffling, disabled }) => {
  // Constants for Flat Topped Hexagon layout
  const hexHeight = 87;
  const gap = 6;
  const distance = hexHeight + gap;

  // Radial positions for flat-topped neighbors (0 degrees is Top)
  // Angles: 0, 60, 120, 180, 240, 300
  const angles = [0, 60, 120, 180, 240, 300];

  const getPosition = (angleDeg: number) => {
    const angleRad = (angleDeg - 90) * (Math.PI / 180); // -90 to rotate so 0 is up
    return {
      x: distance * Math.cos(angleRad),
      y: distance * Math.sin(angleRad),
    };
  };

  return (
    <div className="flex items-center justify-center py-0 md:py-8">
      {/* Container scales the entire precise grid to fit screens */}
      <div className="relative w-[280px] h-[260px] transform scale-[0.80] md:scale-100 transition-transform origin-center">

        {/* Center Hexagon */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <Hexagon letter={centerLetter} isCenter onClick={onLetterClick} disabled={disabled} />
        </div>

        {/* Outer Hexagons */}
        {outerLetters.slice(0, 6).map((letter, index) => {
          const pos = getPosition(angles[index]);
          return (
            <div
              key={index}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
              style={{
                transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`
              }}
            >
              <Hexagon letter={letter} onClick={onLetterClick} isShuffling={isShuffling} disabled={disabled} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Hive;
