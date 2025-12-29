import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { PuzzleData } from './types';
import { getDailyPuzzle, calculateRank } from './services/puzzleService';
import { loadDictionary } from './services/dictionaryService';
import {
  loadDailyProgress,
  saveDailyProgress,
  clearDailyProgress,
  updateStatsWithDailyGame,
  loadStats,
  GameStats
} from './services/storageService';
import { getAmsterdamDateString, getFormattedDisplayDate, getTimeUntilMidnightAmsterdam } from './utils/dateUtils';
import Hive from './components/Hive';
import ScoreBoard from './components/ScoreBoard';
import StatsModal from './components/StatsModal';
import AboutModal from './components/AboutModal';
import CelebrationConfetti from './components/CelebrationConfetti';
import FoundWordsList from './components/FoundWordsList';
import GameTimer from './components/GameTimer';
import { MACEDONIAN_ALPHABET } from './constants';

// Game timing constants
const GAME_DURATION_SECONDS = 60;
const MAX_WORDS_FOR_SCORING = 55;

// Animation durations (ms)
const CELEBRATION_DURATION_MS = 4000;
const TOAST_DURATION_MS = 1500;
const TIME_BONUS_ANIMATION_MS = 1000;
const SHAKE_DURATION_MS = 500;
const CLEAR_INPUT_DELAY_MS = 600;
const SHUFFLE_DELAY_MS = 200;
const ALL_WORDS_TOAST_DURATION_MS = 5000;
const ALL_WORDS_CELEBRATION_MS = 3000;
const COMPLETE_CELEBRATION_DELAY_MS = 500;

const App: React.FC = () => {
  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
  const [input, setInput] = useState<string>('');
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [score, setScore] = useState<number>(0);
  const [message, setMessage] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showFoundWords, setShowFoundWords] = useState<boolean>(false);

  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [stats, setStats] = useState<GameStats>(loadStats());
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [totalPossibleScore, setTotalPossibleScore] = useState<number>(0);

  const [timeLeft, setTimeLeft] = useState<number>(GAME_DURATION_SECONDS);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [hasTimerStarted, setHasTimerStarted] = useState<boolean>(false);
  const [timeBonus, setTimeBonus] = useState<number | null>(null);

  // Initialize with actual value to avoid placeholder flash
  const [nextPuzzleCountdown, setNextPuzzleCountdown] = useState<string>(() => getTimeUntilMidnightAmsterdam());

  const totalPossibleScoreRef = useRef(0);
  const hasShownCelebrationRef = useRef(false);
  const toastTimeoutRef = useRef<number | null>(null);
  const shakeTimeoutRef = useRef<number | null>(null);
  const clearInputTimeoutRef = useRef<number | null>(null);

  // Memoize sorted words for mobile display
  const sortedFoundWords = useMemo(() =>
    [...foundWords].sort((a, b) => a.localeCompare(b)),
    [foundWords]
  );

  // Memoize current rank to avoid recalculating during renders
  const currentRank = useMemo(() =>
    calculateRank(score, totalPossibleScore || 100),
    [score, totalPossibleScore]
  );

  // Memoize pangrams count
  const todayPangrams = useMemo(() =>
    puzzle ? foundWords.filter(w => puzzle.pangrams.includes(w)).length : 0,
    [foundWords, puzzle]
  );

  const initGame = async () => {
    setIsLoading(true);
    try {
      const dictionary = await loadDictionary();
      const data = await getDailyPuzzle(dictionary);

      // Calculate capped max score: avgScore * min(MAX_WORDS_FOR_SCORING, totalWords)
      let totalRawScore = 0;
      data.validWords.forEach(word => {
        if (word.length === 4) totalRawScore += 1;
        else if (word.length > 4) totalRawScore += word.length;
        if (data.pangrams.includes(word)) totalRawScore += 7;
      });

      const totalWords = data.validWords.length;
      const avgScorePerWord = totalRawScore / totalWords;
      const cappedWords = Math.min(MAX_WORDS_FOR_SCORING, totalWords);
      const cappedMaxScore = Math.round(cappedWords * avgScorePerWord);

      // Store in state AND ref (ref for callbacks that may have stale closure)
      setTotalPossibleScore(cappedMaxScore);
      totalPossibleScoreRef.current = cappedMaxScore;

      const todayStr = getAmsterdamDateString();
      const savedProgress = loadDailyProgress();

      if (savedProgress) {
        if (savedProgress.date === todayStr) {
          // Validate puzzle matches saved progress
          if (savedProgress.centerLetter === data.centerLetter &&
              JSON.stringify(savedProgress.outerLetters.sort()) === JSON.stringify(data.outerLetters.sort())) {

            setFoundWords(savedProgress.foundWords);
            setScore(savedProgress.score);

            // Restore timer state only if all fields are present (migration safety)
            const hasCompleteTimerState =
              typeof savedProgress.timeLeft === 'number' &&
              typeof savedProgress.isGameOver === 'boolean' &&
              typeof savedProgress.hasTimerStarted === 'boolean';

            if (hasCompleteTimerState) {
              setTimeLeft(Math.max(0, savedProgress.timeLeft));
              setIsGameOver(savedProgress.isGameOver);
              setHasTimerStarted(savedProgress.hasTimerStarted);
            } else {
              setTimeLeft(GAME_DURATION_SECONDS);
              setIsGameOver(false);
              setHasTimerStarted(false);
            }

          } else {
            console.warn("Saved progress mismatch with generated puzzle. Resetting.");
            clearDailyProgress();
            setTimeLeft(GAME_DURATION_SECONDS);
            setIsGameOver(false);
            setHasTimerStarted(false);
            hasShownCelebrationRef.current = false;
          }
        } else {
          clearDailyProgress();
          setTimeLeft(GAME_DURATION_SECONDS);
          setIsGameOver(false);
          setHasTimerStarted(false);
          hasShownCelebrationRef.current = false;
        }
      } else {
        setTimeLeft(GAME_DURATION_SECONDS);
        setIsGameOver(false);
        setHasTimerStarted(false);
        hasShownCelebrationRef.current = false;
      }

      setPuzzle(data);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to load puzzle:", err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await initGame();
    }
    load();
  }, []);

  // Persist progress whenever important state changes
  useEffect(() => {
    if (!puzzle) return;

    const todayStr = getAmsterdamDateString();

    saveDailyProgress({
      date: todayStr,
      foundWords,
      score,
      centerLetter: puzzle.centerLetter,
      outerLetters: puzzle.outerLetters,
      timeLeft,
      isGameOver,
      hasTimerStarted
    });

    if (foundWords.length > 0) {
      const newStats = updateStatsWithDailyGame(
        todayStr,
        score,
        currentRank,
        foundWords.length,
        todayPangrams
      );
      setStats(newStats);
    } else if (isGameOver) {
      // Record game played even with 0 score
      const newStats = updateStatsWithDailyGame(
        todayStr,
        score,
        currentRank,
        0,
        0
      );
      setStats(newStats);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foundWords, score, puzzle, isGameOver, hasTimerStarted, currentRank, todayPangrams]);

  // Timer pauses when about modal is open
  useEffect(() => {
    if (!hasStarted || !hasTimerStarted || isGameOver || isAboutOpen) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted, hasTimerStarted, isGameOver, isAboutOpen]);

  useEffect(() => {
    if (timeBonus === null) return;
    const timer = setTimeout(() => setTimeBonus(null), TIME_BONUS_ANIMATION_MS);
    return () => clearTimeout(timer);
  }, [timeBonus]);

  // Clear input and UI state when game ends
  useEffect(() => {
    if (isGameOver) {
      setInput('');
      // Clear any pending toast timeouts
      if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
      if (shakeTimeoutRef.current) window.clearTimeout(shakeTimeoutRef.current);
      if (clearInputTimeoutRef.current) window.clearTimeout(clearInputTimeoutRef.current);
      setMessage('');
      setIsShaking(false);
    }
  }, [isGameOver]);

  // Show celebration if max score reached, otherwise just stats modal
  useEffect(() => {
    if (!isGameOver || !puzzle) return;

    // Close About modal if open to avoid modal conflict
    setIsAboutOpen(false);

    if (score >= totalPossibleScore && totalPossibleScore > 0) {
      if (hasShownCelebrationRef.current) return;
      hasShownCelebrationRef.current = true;

      // setTimeout avoids React warning about sync setState in effect
      const celebrationTimer = setTimeout(() => {
        setShowCelebration(true);
      }, 0);
      const statsTimer = setTimeout(() => {
        setShowCelebration(false);
        setIsStatsOpen(true);
      }, CELEBRATION_DURATION_MS);
      return () => {
        clearTimeout(celebrationTimer);
        clearTimeout(statsTimer);
      };
    } else {
      const timer = setTimeout(() => {
        setIsStatsOpen(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isGameOver, puzzle, score, totalPossibleScore]);

  // Update countdown timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNextPuzzleCountdown(getTimeUntilMidnightAmsterdam());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleInput = useCallback((char: string) => {
    if (MACEDONIAN_ALPHABET.includes(char)) {
      setInput(prev => prev + char);
      setMessage('');
    }
  }, []);

  const handleDelete = useCallback(() => {
    setInput(prev => prev.slice(0, -1));
  }, []);

  // Toast function wrapped in useCallback - refs don't need to be in deps
  const showToast = useCallback((msg: string, shake = false, durationMs = TOAST_DURATION_MS) => {
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    if (shakeTimeoutRef.current) window.clearTimeout(shakeTimeoutRef.current);
    if (clearInputTimeoutRef.current) window.clearTimeout(clearInputTimeoutRef.current);

    setMessage(msg);
    if (shake) {
      setIsShaking(true);
      shakeTimeoutRef.current = window.setTimeout(() => setIsShaking(false), SHAKE_DURATION_MS);
      clearInputTimeoutRef.current = window.setTimeout(() => {
        setInput('');
      }, CLEAR_INPUT_DELAY_MS);
    }
    toastTimeoutRef.current = window.setTimeout(() => setMessage(''), durationMs);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!puzzle || !input) return;
    if (isGameOver || timeLeft <= 0) return;

    if (!hasTimerStarted) {
      setHasTimerStarted(true);
    }

    const currentInput = input.toUpperCase();
    const puzzleLetters = [puzzle.centerLetter, ...puzzle.outerLetters];

    const hasInvalidLetters = currentInput.split('').some(char => !puzzleLetters.includes(char));
    if (hasInvalidLetters) {
      showToast("Грешни букви", true);
      return;
    }

    if (currentInput.length < 4) {
      showToast("Прекратко", true);
      return;
    }

    if (!currentInput.includes(puzzle.centerLetter)) {
      showToast("Мора да ја содржи буквата во средина", true);
      return;
    }

    if (foundWords.includes(currentInput)) {
      showToast("Веќе пронајден збор", true);
      return;
    }

    if (puzzle.validWordsSet.has(currentInput)) {
      const willCompleteAllWords = foundWords.length + 1 === puzzle.validWords.length;
      let points = currentInput.length === 4 ? 1 : currentInput.length;
      const isPangram = puzzle.pangrams.includes(currentInput);
      if (isPangram) points += 7;

      const SUCCESS_MESSAGES = ["браво", "одлично", "супер", "само напред", "тоа е тоа"];
      const randomMessage = SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)];

      setFoundWords(prev => [currentInput, ...prev]);
      setScore(prev => prev + points);
      setInput('');

      setTimeLeft(prev => prev + points);
      setTimeBonus(points);

      showToast(isPangram ? `ПАНГРАМ! ${randomMessage}!` : `${randomMessage}!`, false, TOAST_DURATION_MS);

      if (willCompleteAllWords) {
        window.setTimeout(() => {
          showToast(
            `Честито! Ги пронајдовте сите ${puzzle.validWords.length} зборови. Секоја Чест!`,
            false,
            ALL_WORDS_TOAST_DURATION_MS
          );
          setShowCelebration(true);
          window.setTimeout(() => setShowCelebration(false), ALL_WORDS_CELEBRATION_MS);
        }, COMPLETE_CELEBRATION_DELAY_MS);
      }

    } else {
      showToast("Зборот не е во листата", true);
    }
  }, [puzzle, input, foundWords, hasTimerStarted, isGameOver, timeLeft, showToast]);

  const copyToClipboard = async (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch {
        document.body.removeChild(textArea);
        return false;
      }
    }
  };

  const handleShare = useCallback(async () => {
    if (!puzzle) return;

    const dateStr = getFormattedDisplayDate(true);

    const shareText = `🐝 Македонска пчелка
${dateStr}
Ранг: ${currentRank} 🐝

⬜️ Зборови: ${foundWords.length}
🟨 Поени: ${score}

https://pcelka.mk`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Македонска пчелка',
          text: shareText,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          const success = await copyToClipboard(shareText);
          if (success) {
            showToast("Резултатот е ископиран", false, 2000);
          }
        }
      }
    } else {
      const success = await copyToClipboard(shareText);
      if (success) {
        showToast("Резултатот е ископиран", false, 2000);
      } else {
        showToast("Неуспешно копирање", true);
      }
    }
  }, [puzzle, score, foundWords.length, showToast, currentRank]);

  const handleShuffle = useCallback(() => {
    if (!puzzle || isShuffling) return;

    setIsShuffling(true);

    setTimeout(() => {
      const original = puzzle.outerLetters;
      let shuffled = [...original];

      // Ensure shuffle produces a different arrangement
      let attempts = 0;
      do {
        shuffled = shuffled.sort(() => Math.random() - 0.5);
        attempts++;
      } while (
        attempts < 10 &&
        shuffled.every((char, i) => char === original[i])
      );

      setPuzzle({ ...puzzle, outerLetters: shuffled });
      setIsShuffling(false);
    }, SHUFFLE_DELAY_MS);
  }, [puzzle, isShuffling]);

  const mapToCyrillic = (key: string): string => {
    const map: {[key: string]: string} = {
      'A': 'А', 'B': 'Б', 'V': 'В', 'G': 'Г', 'D': 'Д', 'K': 'К',
      'E': 'Е', 'Z': 'З', 'I': 'И', 'J': 'Ј', 'L': 'Л', 'M': 'М',
      'N': 'Н', 'O': 'О', 'P': 'П', 'R': 'Р', 'S': 'С', 'T': 'Т',
      'U': 'У', 'F': 'Ф', 'H': 'Х', 'C': 'Ц'
    };
    return map[key] || key;
  };

  useEffect(() => {
    if (!hasStarted || isGameOver) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();

      if (key === 'BACKSPACE') {
        handleDelete();
        return;
      }

      if (key === 'ENTER') {
        handleSubmit();
        return;
      }

      const cyrillicKey = mapToCyrillic(key);
      if (MACEDONIAN_ALPHABET.includes(cyrillicKey)) {
        handleInput(cyrillicKey);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [puzzle, input, foundWords, handleDelete, handleSubmit, handleInput, hasStarted, isGameOver]);

  const getInputLetterClass = (char: string) => {
    if (!puzzle) return 'text-black';
    if (char === puzzle.centerLetter) return 'text-yellow-400';
    if (puzzle.outerLetters.includes(char)) return 'text-black';
    return 'text-gray-300';
  };

  if (!hasStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f7da21] text-black p-6 relative">
        <div className="flex flex-col items-center max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-500">

          <div className="w-28 h-28 md:w-36 md:h-36 relative mb-2">
            <img src={`${import.meta.env.BASE_URL}bee.svg`} alt="Bee" className="w-full h-full drop-shadow-sm" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-slab text-black">
            Македонска пчелка
          </h1>

          <p className="text-3xl md:text-4xl font-medium text-gray-900 leading-tight">
            Колку зборови можеш да составиш со 7 букви?
          </p>

          {isGameOver ? (
            <>
              <div className="mt-10 flex flex-col items-center gap-2">
                <span className="text-lg font-medium text-black/80">Нареден предизвик за</span>
                <div className="flex items-center gap-3 px-8 py-4 bg-black/10 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="9" />
                    <path strokeLinecap="round" d="M12 7v5l3 3" />
                  </svg>
                  <span className="font-mono font-bold text-2xl text-black">{nextPuzzleCountdown}</span>
                </div>
              </div>
              <button
                onClick={() => setHasStarted(true)}
                className="mt-4 px-8 py-3 bg-black text-white rounded-full font-bold text-base hover:bg-gray-800 active:scale-95 transition-all shadow-lg"
              >
                Погледни резултат
              </button>
            </>
          ) : (
            <button
              onClick={() => setHasStarted(true)}
              disabled={isLoading}
              className="mt-10 px-12 py-4 bg-black text-white rounded-full font-bold text-xl hover:bg-gray-800 active:scale-95 transition-all w-48 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Вчитувам...' : 'Играј'}
            </button>
          )}

          <div className="mt-12 text-center space-y-1">
            <p className="font-extrabold text-lg text-black">
              {getFormattedDisplayDate(true)}
            </p>
            <p className="text-sm font-bold text-black">Едитор: <a href="https://www.linkedin.com/in/jovanvel/" target="_blank" rel="noopener noreferrer" className="text-black no-underline hover:no-underline">Јован</a></p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] max-w-6xl mx-auto md:px-6 select-none overflow-hidden bg-white">

      <div className="flex-1 flex flex-col px-4 py-2 md:py-6 h-full overflow-hidden md:overflow-y-auto overflow-x-hidden touch-none md:border-r md:border-gray-100 md:pr-8">
        <header className="flex justify-between items-center mb-2 md:mb-6 border-b pb-2 md:pb-4">
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-slab font-bold tracking-tight text-gray-900">Македонска пчелка</h1>
            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">Дневен предизвик</span>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-3 mb-1">
              <GameTimer timeLeft={timeLeft} isGameOver={isGameOver} timeBonus={timeBonus} />

              {isGameOver && (
                <>
                  <button
                    onClick={() => setIsStatsOpen(true)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    title="Статистика"
                    aria-label="Отвори статистика"
                    style={{
                      animation: 'gentlePulse 2s ease-in-out infinite'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    title="Сподели"
                    aria-label="Сподели резултат"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                </>
              )}
              <div className="hidden md:block text-xs md:text-sm font-bold text-gray-600">
                {getFormattedDisplayDate(false)}
              </div>
            </div>
          </div>
        </header>

        <ScoreBoard
          score={score}
          totalPossibleScore={totalPossibleScore}
        />

        <div className="mb-2 md:hidden w-full max-w-md mx-auto px-2">
          <div
            onClick={() => setShowFoundWords(!showFoundWords)}
            className="cursor-pointer border-2 border-gray-100 rounded-xl px-4 py-2 flex justify-between items-center group bg-gray-50 min-h-[42px]"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="font-bold text-gray-600 text-xs truncate">
                {foundWords.length > 0
                  ? sortedFoundWords.join('  ')
                  : 'Пронајдени зборови...'}
              </span>
            </div>
            <div className="flex items-center gap-1 pl-2 shrink-0">
              {foundWords.length > 0 && <span className="text-xs font-bold text-black bg-yellow-400 px-1.5 py-0.5 rounded-full">{foundWords.length}</span>}
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-400 transition-transform ${showFoundWords ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {showFoundWords && (
            <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 overflow-y-auto max-h-48 p-4 bg-white rounded-xl border-2 border-gray-100 shadow-sm animate-in fade-in zoom-in-95">
              <FoundWordsList
                words={sortedFoundWords}
                pangrams={puzzle?.pangrams || []}
                isMobile={true}
              />
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center md:min-h-[400px]">
          <div className="relative w-full flex items-center justify-center mb-0 min-h-[48px] md:min-h-[60px]">
            {message && (
              <div className="absolute -top-14 z-50 bg-black text-white px-5 py-3 rounded-lg shadow-2xl font-bold text-base transform transition-all animate-in fade-in slide-in-from-top-2">
                {message}
              </div>
            )}

            <div className={`text-4xl md:text-6xl font-semibold uppercase flex items-center justify-center ${isShaking ? 'shake' : ''} tracking-wide h-12 md:h-16`}>
              {input.split('').map((char, i) => (
                <span key={i} className={getInputLetterClass(char)}>
                  {char}
                </span>
              ))}
              <span className="w-1 h-8 md:h-14 bg-yellow-400 ml-1 animate-pulse"></span>
            </div>
          </div>

          <div className="flex items-center justify-center w-full my-0 md:my-2 md:flex-1">
            {puzzle && (
              <Hive
                centerLetter={puzzle.centerLetter}
                outerLetters={puzzle.outerLetters}
                onLetterClick={(char) => handleInput(char)}
                isShuffling={isShuffling}
                disabled={isGameOver}
              />
            )}
          </div>

          <div className="flex gap-4 md:gap-6 mt-2 md:mt-6 w-full justify-center items-center">
            <button
              onClick={handleDelete}
              disabled={isGameOver}
              aria-label="Избриши последна буква"
              className="px-6 py-3 border-2 border-gray-200 rounded-full font-bold text-sm text-gray-800 hover:bg-gray-50 active:scale-95 transition-all w-28 text-center disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              Избриши
            </button>

            <button
              onClick={handleShuffle}
              disabled={isGameOver}
              aria-label="Промешај букви"
              className="p-3 border-2 border-gray-200 rounded-full hover:bg-gray-50 active:scale-90 transition-all flex items-center justify-center w-12 h-12 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            <button
              onClick={handleSubmit}
              disabled={!input || isGameOver}
              aria-label="Внеси збор"
              className="px-6 py-3 border-2 border-gray-200 rounded-full font-bold text-sm text-gray-800 hover:bg-gray-50 active:scale-95 transition-all w-28 text-center disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              Внеси
            </button>
          </div>

          <div className="flex w-full justify-center items-center mt-4">
            <button
              onClick={() => setIsAboutOpen(true)}
              aria-label="Отвори информации за играта"
              className="px-6 py-3 border-2 border-gray-200 rounded-full font-bold text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:scale-95 transition-all w-40 text-center"
            >
              За играта
            </button>
          </div>
        </div>
      </div>

      <div className="hidden md:flex flex-col w-80 py-6 pl-8 h-full">
        <div className="border border-gray-200 rounded-xl p-6 h-full flex flex-col shadow-sm bg-white">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900">Пронајдени зборови</h3>
            <p className="text-sm text-gray-500 font-medium">
              {foundWords.length === 0
                ? "Сеуште немате пронајдено зборови"
                : `Вкупно ${foundWords.length} зборови`
              }
            </p>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {foundWords.length > 0 ? (
              <div className="flex flex-col">
                <FoundWordsList
                  words={sortedFoundWords}
                  pangrams={puzzle?.pangrams || []}
                  isMobile={false}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-gray-300">
                <div className="w-16 h-16 border-4 border-gray-100 rounded-full flex items-center justify-center mb-2">
                  <span className="text-2xl">?</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        onShare={handleShare}
        stats={stats}
        todayScore={score}
        todayWords={foundWords.length}
        todayRank={currentRank}
        todayPangrams={todayPangrams}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      <CelebrationConfetti isActive={showCelebration} />
    </div>
  );
};

export default App;
