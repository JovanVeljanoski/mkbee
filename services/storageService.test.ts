import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadStats,
  saveStats,
  updateStatsWithDailyGame,
  saveDailyProgress,
  loadDailyProgress,
  clearDailyProgress,
  GameStats,
  DailyProgress
} from './storageService';
import { GameRank } from '../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('storageService', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('loadStats', () => {
    it('should return initial stats when localStorage is empty', () => {
      const stats = loadStats();

      expect(stats.totalGamesPlayed).toBe(0);
      expect(stats.totalPoints).toBe(0);
      expect(stats.topScore).toBe(0);
      expect(stats.totalWordsFound).toBe(0);
      expect(stats.totalPangramsFound).toBe(0);
      expect(stats.dailyScores).toEqual([]);
    });

    it('should merge with initial stats for legacy data missing fields', () => {
      // Simulate old data without totalPoints
      const legacyData = {
        totalGamesPlayed: 5,
        topScore: 100,
        totalWordsFound: 50,
        rankDistribution: {},
        dailyScores: []
      };
      localStorageMock.setItem('mkbee_stats', JSON.stringify(legacyData));

      const stats = loadStats();

      expect(stats.totalGamesPlayed).toBe(5);
      expect(stats.totalPoints).toBe(0); // Should have default value
      expect(stats.totalPangramsFound).toBe(0); // Should have default value
    });
  });

  describe('updateStatsWithDailyGame', () => {
    it('should correctly accumulate totals for a new day entry', () => {
      const stats = updateStatsWithDailyGame(
        '2024-01-15',
        50,
        GameRank.Good,
        10,
        2
      );

      expect(stats.totalGamesPlayed).toBe(1);
      expect(stats.totalPoints).toBe(50);
      expect(stats.totalWordsFound).toBe(10);
      expect(stats.totalPangramsFound).toBe(2);
      expect(stats.dailyScores).toHaveLength(1);
      expect(stats.dailyScores[0].score).toBe(50);
    });

    it('should calculate diffs correctly when updating existing day entry', () => {
      // First entry
      updateStatsWithDailyGame('2024-01-15', 30, GameRank.GoodStart, 5, 1);

      // Update same day with more progress
      const stats = updateStatsWithDailyGame('2024-01-15', 80, GameRank.Good, 12, 3);

      expect(stats.totalGamesPlayed).toBe(1); // Still 1 game
      expect(stats.totalPoints).toBe(80); // 30 + (80 - 30) = 80
      expect(stats.totalWordsFound).toBe(12); // 5 + (12 - 5) = 12
      expect(stats.totalPangramsFound).toBe(3); // 1 + (3 - 1) = 3
      expect(stats.dailyScores).toHaveLength(1);
    });

    it('should update rank distribution when rank changes', () => {
      // Start at GoodStart
      updateStatsWithDailyGame('2024-01-15', 10, GameRank.GoodStart, 3, 0);

      let stats = loadStats();
      expect(stats.rankDistribution[GameRank.GoodStart]).toBe(1);

      // Improve to Good rank
      stats = updateStatsWithDailyGame('2024-01-15', 50, GameRank.Good, 10, 1);

      expect(stats.rankDistribution[GameRank.GoodStart]).toBe(0);
      expect(stats.rankDistribution[GameRank.Good]).toBe(1);
    });

    it('should update top score when new score is higher', () => {
      updateStatsWithDailyGame('2024-01-15', 50, GameRank.Good, 10, 0);
      updateStatsWithDailyGame('2024-01-16', 100, GameRank.Great, 20, 2);

      const stats = loadStats();
      expect(stats.topScore).toBe(100);
      expect(stats.topScoreDate).toBe('2024-01-16');
    });

    it('should handle multiple different days correctly', () => {
      updateStatsWithDailyGame('2024-01-15', 30, GameRank.GoodStart, 5, 0);
      updateStatsWithDailyGame('2024-01-16', 50, GameRank.Good, 10, 1);
      updateStatsWithDailyGame('2024-01-17', 40, GameRank.MovingUp, 8, 0);

      const stats = loadStats();

      expect(stats.totalGamesPlayed).toBe(3);
      expect(stats.totalPoints).toBe(120); // 30 + 50 + 40
      expect(stats.totalWordsFound).toBe(23); // 5 + 10 + 8
      expect(stats.totalPangramsFound).toBe(1);
      expect(stats.dailyScores).toHaveLength(3);
    });

    it('should handle missing pangramsFound in legacy daily entry', () => {
      // Manually create a legacy entry without pangramsFound
      const legacyStats: GameStats = {
        totalGamesPlayed: 1,
        totalPoints: 50,
        topScore: 50,
        topScoreDate: '2024-01-15',
        totalWordsFound: 10,
        totalPangramsFound: 0,
        rankDistribution: { [GameRank.Good]: 1 },
        dailyScores: [{
          date: '2024-01-15',
          score: 50,
          rank: GameRank.Good,
          wordsFound: 10,
          pangramsFound: 0  // Explicitly 0, but tests the || 0 fallback
        }]
      };
      saveStats(legacyStats);

      // Update the same day
      const stats = updateStatsWithDailyGame('2024-01-15', 80, GameRank.Solid, 15, 2);

      expect(stats.totalPangramsFound).toBe(2);
      expect(stats.dailyScores[0].pangramsFound).toBe(2);
    });
  });

  describe('DailyProgress', () => {
    it('should save and load daily progress', () => {
      const progress: DailyProgress = {
        date: '2024-01-15',
        foundWords: ['ТЕСТ', 'ЗБОР'],
        score: 10,
        centerLetter: 'А',
        outerLetters: ['Б', 'В', 'Г', 'Д', 'Е', 'Ж'],
        timeLeft: 45,
        isGameOver: false,
        hasTimerStarted: true
      };

      saveDailyProgress(progress);
      const loaded = loadDailyProgress();

      expect(loaded).toEqual(progress);
    });

    it('should return null when no progress exists', () => {
      const loaded = loadDailyProgress();
      expect(loaded).toBeNull();
    });

    it('should clear daily progress', () => {
      const progress: DailyProgress = {
        date: '2024-01-15',
        foundWords: ['ТЕСТ'],
        score: 5,
        centerLetter: 'А',
        outerLetters: ['Б', 'В', 'Г', 'Д', 'Е', 'Ж'],
        timeLeft: 30,
        isGameOver: false,
        hasTimerStarted: true
      };

      saveDailyProgress(progress);
      clearDailyProgress();
      const loaded = loadDailyProgress();

      expect(loaded).toBeNull();
    });
  });
});

