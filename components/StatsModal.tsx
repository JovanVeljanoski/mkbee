
import React from 'react';
import { GameStats } from '../services/storageService';
import { GameRank } from '../types';
import { RANKS } from '../constants';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: GameStats;
}

const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, stats }) => {
  if (!isOpen) return null;

  // Calculate max frequency for bar chart normalization
  const maxFreq = Math.max(
    ...RANKS.map(r => stats.rankDistribution[r.name] || 0),
    1
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
          <h2 className="text-xl font-bold font-slab text-gray-900">Статистика</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-8">

          {/* Top Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center p-3 bg-yellow-50 rounded-xl border border-yellow-100">
              <span className="text-3xl font-extrabold text-black">{stats.totalGamesPlayed}</span>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Изиграни</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-yellow-50 rounded-xl border border-yellow-100">
              <span className="text-3xl font-extrabold text-black">{stats.totalWordsFound}</span>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Зборови</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-yellow-50 rounded-xl border border-yellow-100 col-span-2">
              <span className="text-3xl font-extrabold text-black">{stats.topScore}</span>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Најдобар резултат</span>
              {stats.topScoreDate && (
                <span className="text-[10px] text-gray-400 mt-1">{stats.topScoreDate}</span>
              )}
            </div>
          </div>

          {/* Rank Distribution Chart */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-widest">Дистрибуција на рангови</h3>
            <div className="space-y-2">
              {[...RANKS].reverse().map((rank) => {
                const count = stats.rankDistribution[rank.name] || 0;
                const percentage = (count / maxFreq) * 100;
                // Only show ranks that have been achieved at least once or are "Genius" to aspire to
                if (count === 0 && rank.name !== GameRank.Genius) return null;

                return (
                  <div key={rank.name} className="flex items-center gap-3 text-sm">
                    <div className="w-24 font-bold text-gray-700 text-right truncate">
                      {rank.name}
                    </div>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden flex items-center">
                      <div
                        className={`h-full ${count > 0 ? 'bg-yellow-400' : 'bg-gray-200'} transition-all duration-500 min-w-[1.5rem] flex items-center justify-end px-2`}
                        style={{ width: `${Math.max(percentage, 5)}%` }}
                      >
                        <span className="font-bold text-black text-xs">{count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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

export default StatsModal;
