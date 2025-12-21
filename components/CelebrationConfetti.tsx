
import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface CelebrationConfettiProps {
  isActive: boolean;
}

const CelebrationConfetti: React.FC<CelebrationConfettiProps> = ({ isActive }) => {
  useEffect(() => {
    if (!isActive) return;

    const durationMs = 3000;
    const end = Date.now() + durationMs;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#f7da21', '#000000', '#ffffff'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#f7da21', '#000000', '#ffffff'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, [isActive]);

  return null;
};

export default CelebrationConfetti;
