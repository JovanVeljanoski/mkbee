
export interface PuzzleData {
  centerLetter: string;
  outerLetters: string[];
  validWords: string[];
  validWordsSet: Set<string>;
  pangrams: string[];
}

export enum GameRank {
  Beginner = 'Почетник',
  GoodStart = 'Добар почеток',
  MovingUp = 'Напредуваш',
  Good = 'Добро',
  Solid = 'Солидно',
  Amazing = 'Одлично',
  Great = 'Супер',
  Genius = 'Генијалец'
}

export interface RankInfo {
  name: GameRank;
  minScore: number;
}
