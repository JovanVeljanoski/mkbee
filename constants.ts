import { GameRank, RankInfo } from './types';

export const MACEDONIAN_ALPHABET = [
  'А', 'Б', 'В', 'Г', 'Д', 'Ѓ', 'Е', 'Ж', 'З', 'Ѕ', 'И', 'Ј', 'К', 'Л', 'Љ', 'М', 'Н', 'Њ', 'О', 'П', 'Р', 'С', 'Т', 'Ќ', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Џ', 'Ш'
];

export const RANKS: RankInfo[] = [
  { name: GameRank.Beginner, minScore: 0 },
  { name: GameRank.GoodStart, minScore: 2 },
  { name: GameRank.MovingUp, minScore: 5 },
  { name: GameRank.Good, minScore: 8 },
  { name: GameRank.Solid, minScore: 15 },
  { name: GameRank.Amazing, minScore: 25 },
  { name: GameRank.Great, minScore: 40 },
  { name: GameRank.Genius, minScore: 70 },
];

export const COLORS = {
  yellow: '#f7da21',
  lightGray: '#e6e6e6',
};
