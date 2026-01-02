import React, { useState, useEffect } from 'react';
import { getTimeUntilMidnightAmsterdam } from '../utils/dateUtils';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  isGameOver: boolean;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, isGameOver }) => {
  // Initialize with actual value to avoid empty flash
  const [timeLeft, setTimeLeft] = useState<string>(() => getTimeUntilMidnightAmsterdam());

  useEffect(() => {
    // Only run timer when modal is open AND game is over (timer is displayed)
    if (!isOpen || !isGameOver) return;

    const timer = setInterval(() => {
      setTimeLeft(getTimeUntilMidnightAmsterdam());
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isGameOver]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
          <h2 className="text-xl font-bold font-slab text-gray-900">За играта</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-gray-800">
          <p className="leading-relaxed">
            Ова е клон на популарната <a href="https://www.nytimes.com/puzzles/spelling-bee" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold hover:text-blue-800">Spelling bee</a> игра на New York Times.
          </p>

          <p className="leading-relaxed">
            Кодот на оваа игра е јавен и може да го видите <a href="https://github.com/JovanVeljanoski/mkbee" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold hover:text-blue-800">овде</a>.
          </p>

          {/* New Marketing Section - Simplified */}
          <div className="border-t pt-4 mt-2">
             <p className="leading-relaxed mb-2">Оригинални проекти од истиот автор:</p>
             <ul className="list-disc pl-5 space-y-1 text-gray-800">
               <li>
                 Учете странски јазици со <a href="https://www.mylexilingo.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold hover:text-blue-800">mylexilingo.com</a>.
               </li>
               <li>
                 Слушајте сказни за мали деца со <a href="https://storytime.mylexilingo.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold hover:text-blue-800">storytime</a>.
               </li>
             </ul>
          </div>

          {isGameOver && (
            <div className="border-t pt-6 mt-6">
               <p className="text-center font-bold text-gray-900 mb-2">Нареден предизвик за:</p>
               <p className="text-center font-light text-4xl text-gray-400 font-mono tracking-wider">
                 {timeLeft}
               </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 text-center">
           <button
             onClick={onClose}
             className="w-full py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
           >
             Затвори
           </button>
        </div>

      </div>
    </div>
  );
};

export default AboutModal;

