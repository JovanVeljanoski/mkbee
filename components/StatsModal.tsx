import React from 'react';
import { GameStats } from '../services/storageService';
import { GameRank } from '../types';
import { RANKS } from '../constants';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare?: () => void;
  stats: GameStats;
  todayScore?: number;
  todayWords?: number;
  todayRank?: GameRank;
  todayPangrams?: number;
}

const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  onShare,
  stats,
  todayScore,
  todayWords,
  todayRank,
  todayPangrams
}) => {
  if (!isOpen) return null;

  const hasTodayStats = todayScore !== undefined && todayWords !== undefined && todayRank !== undefined;

  // Calculate max frequency for bar chart normalization
  const maxFreq = Math.max(
    ...RANKS.map(r => stats.rankDistribution[r.name] || 0),
    1
  );

  // Check if there are any achieved ranks to display
  const achievedRanks = [...RANKS].reverse().filter(rank => (stats.rankDistribution[rank.name] || 0) > 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-bold font-slab text-gray-900">Статистика</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Затвори"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto flex-1">

          {/* Today's Game Section */}
          {hasTodayStats && (
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-xl p-4 border border-yellow-200/60">
              <h3 className="text-[10px] font-bold text-yellow-700/80 uppercase tracking-widest mb-3">Денешна игра</h3>

              {/* Rank Display - Hero Element */}
              <div className="text-center mb-3">
                <div className="inline-flex items-center gap-2 bg-yellow-400 text-black px-4 py-1.5 rounded-full shadow-sm">
                  <span className="text-xl">🐝</span>
                  <span className="text-lg font-extrabold">{todayRank}</span>
                </div>
              </div>

              {/* Today's Stats Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/70 rounded-lg p-2.5 text-center border border-yellow-200/40">
                  <span className="block text-xl font-extrabold text-gray-900">{todayScore}</span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Поени</span>
                </div>
                <div className="bg-white/70 rounded-lg p-2.5 text-center border border-yellow-200/40">
                  <span className="block text-xl font-extrabold text-gray-900">{todayWords}</span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Зборови</span>
                </div>
              </div>

              {/* Pangrams - only show if > 0 */}
              {todayPangrams !== undefined && todayPangrams > 0 && (
                <div className="mt-2.5 flex items-center justify-center gap-1.5 text-yellow-700/90">
                  <span className="text-base">★</span>
                  <span className="font-bold text-xs">{todayPangrams} панграм{todayPangrams > 1 ? 'и' : ''}</span>
                </div>
              )}
            </div>
          )}

          {/* All-Time Stats Section */}
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Вкупно</h3>

            {/* Main stats - 2x2 grid */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="flex flex-col items-center p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-xl font-extrabold text-black">{stats.totalGamesPlayed}</span>
                <span className="text-[10px] font-bold text-gray-500 uppercase">Игри</span>
              </div>
              <div className="flex flex-col items-center p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-xl font-extrabold text-black">{stats.totalPoints || 0}</span>
                <span className="text-[10px] font-bold text-gray-500 uppercase">Поени</span>
              </div>
              <div className="flex flex-col items-center p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-xl font-extrabold text-black">{stats.totalWordsFound}</span>
                <span className="text-[10px] font-bold text-gray-500 uppercase">Зборови</span>
              </div>
              <div className="flex flex-col items-center p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-xl font-extrabold text-black">{stats.totalPangramsFound || 0}</span>
                <span className="text-[10px] font-bold text-gray-500 uppercase">Панграми</span>
              </div>
            </div>

            {/* Top Score */}
            {stats.topScore > 0 && (
              <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100 mb-3">
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Најдобар резултат</span>
                  {stats.topScoreDate && (
                    <span className="text-[9px] text-gray-400 ml-1.5">{stats.topScoreDate}</span>
                  )}
                </div>
                <span className="text-xl font-extrabold text-black">{stats.topScore}</span>
              </div>
            )}

            {/* Rank Distribution Chart - Compact */}
            {achievedRanks.length > 0 && (
              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Рангови</h4>
                <div className="space-y-1">
                  {achievedRanks.map((rank) => {
                    const count = stats.rankDistribution[rank.name] || 0;
                    const percentage = (count / maxFreq) * 100;

                    return (
                      <div key={rank.name} className="flex items-center gap-2 text-xs">
                        <div className="w-20 font-bold text-gray-600 text-right truncate text-[11px]">
                          {rank.name}
                        </div>
                        <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden flex items-center">
                          <div
                            className="h-full bg-yellow-400 transition-all duration-500 min-w-[1rem] flex items-center justify-end px-1.5"
                            style={{ width: `${Math.max(percentage, 10)}%` }}
                          >
                            <span className="font-bold text-black text-[10px]">{count}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 space-y-2 shrink-0 border-t border-gray-100">
          {onShare && (
            <button
              onClick={onShare}
              className="w-full py-2.5 bg-white border-2 border-gray-200 text-gray-800 rounded-xl font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Сподели
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors text-sm"
          >
            Затвори
          </button>
        </div>

      </div>
    </div>
  );
};

export default StatsModal;
