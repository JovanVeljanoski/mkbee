import React from 'react';
import { getFormattedDisplayDate } from '../utils/dateUtils';

interface WelcomeScreenProps {
  isGameOver: boolean;
  isLoading: boolean;
  nextPuzzleCountdown: string;
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ isGameOver, isLoading, nextPuzzleCountdown, onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f7da21] text-black p-6 relative">
      <div className="flex flex-col items-center max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-500">

        <div className="w-28 h-28 md:w-36 md:h-36 relative mb-2">
          <img src={`${import.meta.env.BASE_URL}bee.svg`} alt="Bee" className="w-full h-full drop-shadow-sm" />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-slab text-black">
          Македонска пчелка
        </h1>

        <p className="text-3xl md:text-4xl font-medium text-gray-900 leading-tight">
          Колку зборови можеш да составиш со 7 букви?
        </p>

        {isGameOver ? (
          <>
            <button
              onClick={onStart}
              className="mt-6 px-8 py-3 bg-black text-white rounded-full font-bold text-base hover:bg-gray-800 active:scale-95 transition-all shadow-lg"
            >
              Погледни резултат
            </button>

            <div className="mt-5 flex flex-col items-center gap-2">
              <span className="text-lg font-medium text-black/80">Нареден предизвик за</span>
              <div className="flex items-center gap-3 px-8 py-4 bg-black/10 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="9" />
                  <path strokeLinecap="round" d="M12 7v5l3 3" />
                </svg>
                <span className="font-mono font-bold text-2xl text-black">{nextPuzzleCountdown}</span>
              </div>
            </div>
          </>
        ) : (
          <button
            onClick={onStart}
            disabled={isLoading}
            className="mt-10 px-12 py-4 bg-black text-white rounded-full font-bold text-xl hover:bg-gray-800 active:scale-95 transition-all w-48 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Вчитувам...' : 'Играј'}
          </button>
        )}

        <div className={`${isGameOver ? 'mt-5' : 'mt-12'} text-center space-y-1`}>
          <p className="font-extrabold text-lg text-black">
            {getFormattedDisplayDate(true)}
          </p>
          <p className="text-sm font-bold text-black">Едитор: <a href="https://www.linkedin.com/in/jovanvel/" target="_blank" rel="noopener noreferrer" className="text-black no-underline hover:no-underline">Јован</a></p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
