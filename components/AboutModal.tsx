import React, { useState, useEffect } from 'react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    const calculateTimeLeft = () => {
      const now = new Date();

      // Get current time string in Amsterdam timezone
      const amsterdamTimeStr = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Amsterdam',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
      }).format(now);

      const amsterdamTime = new Date(amsterdamTimeStr);

      // Create next midnight object relative to Amsterdam time
      const nextMidnight = new Date(amsterdamTime);
      nextMidnight.setHours(24, 0, 0, 0);

      const diff = nextMidnight.getTime() - amsterdamTime.getTime();

      if (diff <= 0) {
        return "00:00:00";
      }

      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      const format = (n: number) => n.toString().padStart(2, '0');
      return `${format(hours)}:${format(minutes)}:${format(seconds)}`;
    };

    // Initial calculation
    // setTimeLeft(calculateTimeLeft()); // Avoid direct state update in effect

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

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

          <div className="border-t pt-6 mt-6">
             <p className="text-center font-bold text-gray-900 mb-2">Нареден предизвик за:</p>
             <p className="text-center font-light text-4xl text-gray-400 font-mono tracking-wider">
               {timeLeft}
             </p>
          </div>
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

