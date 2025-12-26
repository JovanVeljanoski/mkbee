import { describe, it, expect } from 'vitest';
import { getDailyPuzzle, calculateRank, seededRandom, shuffleArray } from './puzzleService';
import { GameRank } from '../types';

describe('puzzleService', () => {
  describe('seededRandom', () => {
    it('should generate deterministic numbers for the same seed', () => {
      const seed = '2023-10-27';
      const rng1 = seededRandom(seed);
      const rng2 = seededRandom(seed);

      expect(rng1()).toBe(rng2());
      expect(rng1()).toBe(rng2());
      expect(rng1()).toBe(rng2());
    });

    it('should generate different numbers for different seeds', () => {
      const rng1 = seededRandom('seed1');
      const rng2 = seededRandom('seed2');

      expect(rng1()).not.toBe(rng2());
    });
  });

  describe('shuffleArray', () => {
    it('should maintain array length and elements', () => {
      const input = [1, 2, 3, 4, 5];
      const rng = seededRandom('test');
      const shuffled = shuffleArray(input, rng);

      expect(shuffled).toHaveLength(input.length);
      expect(shuffled.sort()).toEqual(input.sort());
    });
  });

  describe('calculateRank', () => {
    const totalScore = 100;

    it('should return Beginner for score 0', () => {
      expect(calculateRank(0, totalScore)).toBe(GameRank.Beginner);
    });

    it('should return correct rank for various scores', () => {
      // Based on constants.ts: 0, 2, 5, 8, 15, 25, 40, 70
      expect(calculateRank(2, totalScore)).toBe(GameRank.GoodStart);
      expect(calculateRank(5, totalScore)).toBe(GameRank.MovingUp);
      expect(calculateRank(10, totalScore)).toBe(GameRank.Good);
      expect(calculateRank(75, totalScore)).toBe(GameRank.Genius);
    });

    // Edge case tests
    it('should handle exactly-at-threshold scores', () => {
      // Exactly at 70% threshold should be Genius
      expect(calculateRank(70, 100)).toBe(GameRank.Genius);
      // Exactly at 40% threshold should be Great
      expect(calculateRank(40, 100)).toBe(GameRank.Great);
      // Exactly at 25% threshold should be Amazing
      expect(calculateRank(25, 100)).toBe(GameRank.Amazing);
    });

    it('should handle score just below threshold', () => {
      // Just below 70% should be Great
      expect(calculateRank(69, 100)).toBe(GameRank.Great);
      // Just below 40% should be Amazing
      expect(calculateRank(39, 100)).toBe(GameRank.Amazing);
    });

    it('should handle totalPossibleScore of 0 (division by zero protection)', () => {
      // Should default to 100 internally and return Beginner for low scores
      const result = calculateRank(5, 0);
      expect(result).toBe(GameRank.MovingUp); // 5/100 = 5%
    });

    it('should handle score exceeding totalPossibleScore', () => {
      // Score can theoretically exceed max in edge cases
      expect(calculateRank(150, 100)).toBe(GameRank.Genius);
    });

    it('should handle fractional percentage thresholds correctly', () => {
      // With totalScore of 200, 70% = 140
      expect(calculateRank(140, 200)).toBe(GameRank.Genius);
      expect(calculateRank(139, 200)).toBe(GameRank.Great);
    });

    it('should handle small totalPossibleScore values', () => {
      // With totalScore of 10, thresholds are very small
      expect(calculateRank(7, 10)).toBe(GameRank.Genius); // 70%
      expect(calculateRank(4, 10)).toBe(GameRank.Great);  // 40%
    });

    it('should handle negative scores gracefully', () => {
      // Negative scores should still return Beginner
      expect(calculateRank(-10, 100)).toBe(GameRank.Beginner);
    });
  });

  describe('getDailyPuzzle', () => {
    // const mockDictionary = [ ... ]; // Unused

    // For unit testing logic deeply, we might need to mock Date or dependency inject dictionary more flexibly.
    // But we can test basic constraints.

    it('should throw if no pangrams exist', async () => {
      await expect(getDailyPuzzle(['APPLE', 'BANANA'])).rejects.toThrow("Dictionary must contain at least one word with 7 unique letters.");
    });

    it('should generate a valid puzzle structure', async () => {
        // We need a word with exactly 7 unique letters
        // "ABCDEFG"
        const dict = ["ABCDEFG", "ABCDEF", "AAAA", "BBBB"];

        const puzzle = await getDailyPuzzle(dict);

        expect(puzzle).toHaveProperty('centerLetter');
        expect(puzzle).toHaveProperty('outerLetters');
        expect(puzzle.outerLetters).toHaveLength(6);
        expect(puzzle.validWords.length).toBeGreaterThan(0);
        expect(puzzle.pangrams.length).toBeGreaterThan(0);
    });
  });
});

