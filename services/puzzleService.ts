import { PuzzleData, GameRank } from "../types";
import { MACEDONIAN_DICTIONARY, RANKS } from "../constants";
import { getAmsterdamDateString } from "../utils/dateUtils";

// Simple seeded random function
export function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }

  return function() {
    h = (Math.imul(1103515245, h) + 12345) | 0;
    return (h >>> 0) / 0x100000000;
  };
}

// Helper to shuffle array with seeded RNG
export function shuffleArray<T>(array: T[], rng: () => number): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function getDailyPuzzle(dictionaryWords: string[] = MACEDONIAN_DICTIONARY): Promise<PuzzleData> {
  const amsterdamDate = getAmsterdamDateString();
  const rng = seededRandom(amsterdamDate);

  // 2. Find all pangrams (words with exactly 7 unique letters)
  const allPangrams = dictionaryWords.filter(word => {
    const uniqueLetters = new Set(word.toUpperCase());
    return uniqueLetters.size === 7;
  });

  if (allPangrams.length === 0) {
    console.error("No pangrams found in dictionary! Falling back to default.");
    // Fallback if no pangrams exist (should ideally not happen with a good dictionary)
    // For safety, we can return a default seed or try random generation (old method)
    // But let's assume we have at least one pangram or fail gracefully.
    throw new Error("Dictionary must contain at least one word with 7 unique letters.");
  }

  // 3. Select a random pangram as the seed
  const seedIndex = Math.floor(rng() * allPangrams.length);
  const seedPangram = allPangrams[seedIndex];

  // Extract unique letters from the seed
  const uniqueLetters = Array.from(new Set(seedPangram.toUpperCase()));

  // 4. Deterministically pick center letter from these 7
  const centerIndex = Math.floor(rng() * 7);
  const centerLetter = uniqueLetters[centerIndex];

  // 5. The rest are outer letters
  // Shuffle them so they don't appear in the word's order
  const outerLetters = shuffleArray(
    uniqueLetters.filter(l => l !== centerLetter),
    rng
  );

  // 6. Filter dictionary for valid words
  const validWords: string[] = [];
  const validWordsSet = new Set<string>();
  const pangrams: string[] = [];

  const letterSet = new Set(uniqueLetters);

  dictionaryWords.forEach(word => {
    const w = word.toUpperCase();
    if (w.length < 4) return;
    if (!w.includes(centerLetter)) return;

    // Check if word only uses allowed letters
    let valid = true;
    const wordUniqueLetters = new Set();
    for (const char of w) {
      if (!letterSet.has(char)) {
        valid = false;
        break;
      }
      wordUniqueLetters.add(char);
    }

    if (valid) {
      validWords.push(w);
      validWordsSet.add(w);
      if (wordUniqueLetters.size === 7) {
        pangrams.push(w);
      }
    }
  });

  return {
    centerLetter,
    outerLetters,
    validWords: Array.from(new Set(validWords)), // Just in case dictionary has dupes
    validWordsSet: validWordsSet,
    pangrams: Array.from(new Set(pangrams))
  };
}

export function calculateRank(score: number, totalPossibleScore: number): GameRank {
  const safeTotal = totalPossibleScore || 100; // Prevent division by zero

  // Start from highest rank and check downwards
  // Or simpler: Iterate and find the highest rank met
  let currentRank = RANKS[0].name;

  for (let i = 0; i < RANKS.length; i++) {
    const requiredScore = (RANKS[i].minScore / 100) * safeTotal;
    if (score >= requiredScore) {
      currentRank = RANKS[i].name;
    } else {
      break; // Sorted by minScore, so we can stop once we fail a threshold
    }
  }

  return currentRank;
}
