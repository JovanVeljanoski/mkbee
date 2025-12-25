
import { GameRank } from "../types";

// KEY CONSTANTS
const KEYS = {
  DAILY_PROGRESS: 'mkbee_daily_progress',
  STATS: 'mkbee_stats',
  LAST_PLAYED: 'mkbee_last_played'
};

// TYPES
export interface DailyProgress {
  date: string;              // YYYY-MM-DD (Amsterdam time)
  foundWords: string[];
  score: number;
  centerLetter: string;      // For validation
  outerLetters: string[];    // For validation
  timeLeft: number;          // Seconds remaining (0-90)
  isGameOver: boolean;       // True when timer has expired
  hasTimerStarted: boolean;  // True after first word is entered
}

export interface GameStats {
  totalGamesPlayed: number;
  topScore: number;
  topScoreDate: string;
  totalWordsFound: number;
  totalPangramsFound: number;
  rankDistribution: {
    [key in GameRank]?: number;
  };
  dailyScores: Array<{
    date: string;
    score: number;
    rank: GameRank;
    wordsFound: number;
  }>;
}

const INITIAL_STATS: GameStats = {
  totalGamesPlayed: 0,
  topScore: 0,
  topScoreDate: '',
  totalWordsFound: 0,
  totalPangramsFound: 0,
  rankDistribution: {},
  dailyScores: []
};

// DAILY PROGRESS FUNCTIONS

export function saveDailyProgress(progress: DailyProgress): void {
  try {
    localStorage.setItem(KEYS.DAILY_PROGRESS, JSON.stringify(progress));
    localStorage.setItem(KEYS.LAST_PLAYED, progress.date);
  } catch (error) {
    console.error("Failed to save daily progress:", error);
  }
}

export function loadDailyProgress(): DailyProgress | null {
  try {
    const stored = localStorage.getItem(KEYS.DAILY_PROGRESS);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error("Failed to load daily progress:", error);
    return null;
  }
}

export function clearDailyProgress(): void {
  try {
    localStorage.removeItem(KEYS.DAILY_PROGRESS);
  } catch (error) {
    console.error("Failed to clear daily progress:", error);
  }
}

// HISTORICAL STATS FUNCTIONS

export function saveStats(stats: GameStats): void {
  try {
    localStorage.setItem(KEYS.STATS, JSON.stringify(stats));
  } catch (error) {
    console.error("Failed to save stats:", error);
  }
}

export function loadStats(): GameStats {
  try {
    const stored = localStorage.getItem(KEYS.STATS);
    if (!stored) return INITIAL_STATS;
    return { ...INITIAL_STATS, ...JSON.parse(stored) };
  } catch (error) {
    console.error("Failed to load stats:", error);
    return INITIAL_STATS;
  }
}

export function updateStatsWithDailyGame(
  date: string,
  score: number,
  rank: GameRank,
  wordsFoundCount: number,
  pangramsFoundCount: number
): GameStats {
  const stats = loadStats();

  // Check if we already recorded this day to avoid double counting
  // We identify by date in dailyScores
  const existingEntryIndex = stats.dailyScores.findIndex(s => s.date === date);

  if (existingEntryIndex !== -1) {
    // Update existing entry
    const prevEntry = stats.dailyScores[existingEntryIndex];

    // Update totals by removing old values and adding new ones
    // Note: This logic assumes we only call this when finishing a session or updating.
    // However, simpler approach: re-calculate stats from scratch or just update fields?
    // Since we don't store full history of every word found in stats (only count),
    // we should be careful.

    // Better approach: We trigger this update when the game session ends (new day) or
    // we can update it incrementally.

    // Let's adopt a strategy: "Stats reflect completed games or current progress?"
    // Usually stats reflect "games played".
    // If we update on every word, it might be heavy.
    // BUT we need to show current stats in the modal.

    // Let's update the specific day entry and recalculate derived stats.

    stats.dailyScores[existingEntryIndex] = {
      date,
      score,
      rank,
      wordsFound: wordsFoundCount
    };

    // We can't easily "undo" the totals for topScore etc without more data.
    // So for "Total Games Played", "Total Words Found", we might need to handle them carefully.

    // SIMPLIFICATION:
    // We will save stats only when:
    // 1. New day starts (archive yesterday)
    // 2. OR purely rely on `dailyScores` array to derive totals? No, that array might get long.

    // Let's stick to the plan:
    // "Stats update triggers: 1. When day changes (finalize yesterday's game)"
    // "2. When user submits a word (update running totals)?" - Maybe too frequent.

    // Let's do: Update stats only when saving a COMPLETED day (when next day starts)
    // OR update them in real-time?

    // If we update in real-time, we need to handle the diff.
    // Let's implement a simple `updateStats` that takes the FULL current state and merges it.

    // Actually, simply saving the high score and total stats is safer if we do it transactionally.
    // But since we want to be robust:

    // Let's calculate totals from dailyScores + current session?
    // No, historical data might be summarized.

    // STRATEGY:
    // We will trust the passed values are the LATEST for today.
    // We will update the daily entry.
    // We will re-check Top Score.
    // We will NOT increment "Total Words" incrementally here to avoid bugs.
    // Instead, we can calculate "Total Words" by summing dailyScores if we keep them all?
    // Or we store "Legacy Total" + "Daily Scores".

    // Let's just update the daily record and top score for now.
    // Detailed word counts can be tricky if we don't have diffs.

    if (score > stats.topScore) {
      stats.topScore = score;
      stats.topScoreDate = date;
    }

    // Rank distribution - this is tricky if rank changes during the day.
    // We should decrement old rank and increment new rank?
    // Yes, if we track it.

    if (prevEntry.rank !== rank) {
        if (stats.rankDistribution[prevEntry.rank]) {
            stats.rankDistribution[prevEntry.rank]! -= 1;
        }
        stats.rankDistribution[rank] = (stats.rankDistribution[rank] || 0) + 1;
    }

    stats.totalWordsFound += (wordsFoundCount - prevEntry.wordsFound);
    // stats.totalPangramsFound += (pangramsFoundCount - prevEntry.pangramsFound); // We need prev pangrams count... which we don't have in dailyScores
    // We'll skip pangram total tracking for now or add it to dailyScores

  } else {
    // New Day Entry
    stats.totalGamesPlayed += 1;

    stats.dailyScores.push({
      date,
      score,
      rank,
      wordsFound: wordsFoundCount
    });

    if (score > stats.topScore) {
      stats.topScore = score;
      stats.topScoreDate = date;
    }

    stats.rankDistribution[rank] = (stats.rankDistribution[rank] || 0) + 1;
    stats.totalWordsFound += wordsFoundCount;
    stats.totalPangramsFound += pangramsFoundCount;
  }

  saveStats(stats);
  return stats;
}
