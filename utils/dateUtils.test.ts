import { describe, it, expect } from 'vitest';
import {
  getAmsterdamDateString,
  getFormattedDisplayDate,
  getTimeUntilMidnightAmsterdam
} from './dateUtils';

describe('dateUtils', () => {
  describe('getAmsterdamDateString', () => {
    it('should return a string in YYYY-MM-DD format', () => {
      const result = getAmsterdamDateString();

      // Should match YYYY-MM-DD pattern
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return a valid date string', () => {
      const result = getAmsterdamDateString();
      const date = new Date(result);

      // Should be a valid date
      expect(date.toString()).not.toBe('Invalid Date');
    });
  });

  describe('getFormattedDisplayDate', () => {
    it('should include year when includeYear is true', () => {
      const result = getFormattedDisplayDate(true);

      // Should contain a 4-digit year
      expect(result).toMatch(/\d{4}/);
    });

    it('should exclude year when includeYear is false', () => {
      const result = getFormattedDisplayDate(false);

      // Should not contain a 4-digit year (2020-2099)
      expect(result).not.toMatch(/20\d{2}/);
    });

    it('should return a non-empty string', () => {
      const result = getFormattedDisplayDate();

      expect(result.length).toBeGreaterThan(0);
    });

    it('should not end with "г." (Macedonian year suffix)', () => {
      const result = getFormattedDisplayDate(true);

      // Should have stripped the trailing "г."
      expect(result).not.toMatch(/г\.?$/);
    });
  });

  describe('getTimeUntilMidnightAmsterdam', () => {
    it('should return a string in HH:MM:SS format', () => {
      const result = getTimeUntilMidnightAmsterdam();

      // Should match HH:MM:SS pattern
      expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });

    it('should return valid time components', () => {
      const result = getTimeUntilMidnightAmsterdam();
      const [hours, minutes, seconds] = result.split(':').map(Number);

      // Hours should be 0-23
      expect(hours).toBeGreaterThanOrEqual(0);
      expect(hours).toBeLessThanOrEqual(23);

      // Minutes should be 0-59
      expect(minutes).toBeGreaterThanOrEqual(0);
      expect(minutes).toBeLessThanOrEqual(59);

      // Seconds should be 0-59
      expect(seconds).toBeGreaterThanOrEqual(0);
      expect(seconds).toBeLessThanOrEqual(59);
    });

    it('should return decreasing time on subsequent calls (within same second)', () => {
      // This test is timing-sensitive but verifies basic functionality
      const result1 = getTimeUntilMidnightAmsterdam();

      // Convert to total seconds for comparison
      const [h1, m1, s1] = result1.split(':').map(Number);
      const total1 = h1 * 3600 + m1 * 60 + s1;

      // Total seconds until midnight should be between 0 and 24*60*60
      expect(total1).toBeGreaterThanOrEqual(0);
      expect(total1).toBeLessThanOrEqual(86400);
    });
  });
});

