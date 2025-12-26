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

export interface DailyScoreEntry {
  date: string;
  score: number;
  rank: GameRank;
  wordsFound: number;
  pangramsFound: number;
}

export interface GameStats {
  totalGamesPlayed: number;
  totalPoints: number;
  topScore: number;
  topScoreDate: string;
  totalWordsFound: number;
  totalPangramsFound: number;
  rankDistribution: {
    [key in GameRank]?: number;
  };
  dailyScores: DailyScoreEntry[];
}

const INITIAL_STATS: GameStats = {
  totalGamesPlayed: 0,
  totalPoints: 0,
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
    const parsed = JSON.parse(stored);
    // Merge with INITIAL_STATS to handle any missing fields from older versions
    return { ...INITIAL_STATS, ...parsed };
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

  // Check if we already recorded this day
  const existingEntryIndex = stats.dailyScores.findIndex(s => s.date === date);

  if (existingEntryIndex !== -1) {
    // Update existing entry - calculate diffs
    const prevEntry = stats.dailyScores[existingEntryIndex];

    // Calculate diffs for incremental updates
    const wordsDiff = wordsFoundCount - (prevEntry.wordsFound || 0);
    const pangramsDiff = pangramsFoundCount - (prevEntry.pangramsFound || 0);
    const scoreDiff = score - (prevEntry.score || 0);

    // Update the daily entry
    stats.dailyScores[existingEntryIndex] = {
      date,
      score,
      rank,
      wordsFound: wordsFoundCount,
      pangramsFound: pangramsFoundCount
    };

    // Update totals with diffs
    stats.totalWordsFound += wordsDiff;
    stats.totalPangramsFound += pangramsDiff;
    stats.totalPoints += scoreDiff;

    // Update top score if needed
    if (score > stats.topScore) {
      stats.topScore = score;
      stats.topScoreDate = date;
    }

    // Update rank distribution if rank changed
    if (prevEntry.rank !== rank) {
      if (stats.rankDistribution[prevEntry.rank]) {
        stats.rankDistribution[prevEntry.rank]! -= 1;
      }
      stats.rankDistribution[rank] = (stats.rankDistribution[rank] || 0) + 1;
    }

  } else {
    // New Day Entry
    stats.totalGamesPlayed += 1;

    stats.dailyScores.push({
      date,
      score,
      rank,
      wordsFound: wordsFoundCount,
      pangramsFound: pangramsFoundCount
    });

    // Update all totals
    stats.totalPoints += score;
    stats.totalWordsFound += wordsFoundCount;
    stats.totalPangramsFound += pangramsFoundCount;

    if (score > stats.topScore) {
      stats.topScore = score;
      stats.topScoreDate = date;
    }

    stats.rankDistribution[rank] = (stats.rankDistribution[rank] || 0) + 1;
  }

  saveStats(stats);
  return stats;
}
