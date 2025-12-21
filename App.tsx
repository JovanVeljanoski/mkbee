
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import Hive from './components/Hive';
import ScoreBoard from './components/ScoreBoard';
import StatsModal from './components/StatsModal';
import AboutModal from './components/AboutModal';
import CelebrationConfetti from './components/CelebrationConfetti';
import FoundWordsList from './components/FoundWordsList';
import { MACEDONIAN_ALPHABET } from './constants';

const App: React.FC = () => {
  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
  const [input, setInput] = useState<string>('');
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [score, setScore] = useState<number>(0);
  const [message, setMessage] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showFoundWords, setShowFoundWords] = useState<boolean>(false);

  // New state for Welcome Screen
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  // Animation state for shuffling
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  // Stats Modal state
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [stats, setStats] = useState<GameStats>(loadStats());
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [totalPossibleScore, setTotalPossibleScore] = useState<number>(0);

  const totalPossibleScoreRef = useRef(0);

  const initGame = async () => {
    setIsLoading(true);
    try {
      // 1. Load Dictionary (cached or network)
      const dictionary = await loadDictionary();

      // 2. Generate Puzzle using dictionary
      const data = await getDailyPuzzle(dictionary);

      // 3. Setup Max Score for progress bar
      let max = 0;
      data.validWords.forEach(word => {
        if (word.length === 4) max += 1;
        else if (word.length > 4) max += word.length;
        if (data.pangrams.includes(word)) max += 7;
      });
      // Store in state to trigger re-renders properly (ref access in render is bad practice)
      setTotalPossibleScore(max);
      totalPossibleScoreRef.current = max;

      // 4. Check for saved daily progress
      const todayStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Amsterdam',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date());

      const savedProgress = loadDailyProgress();

      if (savedProgress) {
        if (savedProgress.date === todayStr) {
           // Same day - Validate if puzzle matches (safety check)
           if (savedProgress.centerLetter === data.centerLetter &&
               JSON.stringify(savedProgress.outerLetters.sort()) === JSON.stringify(data.outerLetters.sort())) {

             // Restore progress
             setFoundWords(savedProgress.foundWords);
             setScore(savedProgress.score);
             // We don't restore input

           } else {
             console.warn("Saved progress mismatch with generated puzzle. Resetting.");
             clearDailyProgress();
           }
        } else {
           // New Day!
           clearDailyProgress();
        }
      }

      setPuzzle(data);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to load puzzle:", err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Wrap in timeout or use direct async IIFE, though initGame is async.
    // The lint error warns about calling something that sets state synchronously (or effectively so)
    // inside useEffect without dependencies, which might be a loop risk or strict mode double invoke.
    // But initGame IS async.
    // Let's just suppress or ignore if it's a false positive on "cascading renders".
    // Actually, initGame sets loading state immediately.
    const load = async () => {
      await initGame();
    }
    load();
  }, []);

  // Save progress and update stats whenever important state changes
  useEffect(() => {
    if (!puzzle || foundWords.length === 0) return;

    const todayStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Amsterdam',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(new Date());

    saveDailyProgress({
        date: todayStr,
        foundWords,
        score,
        centerLetter: puzzle.centerLetter,
        outerLetters: puzzle.outerLetters
    });

    // Update Stats
    const currentRank = calculateRank(score, totalPossibleScoreRef.current);
    const pangramsCount = foundWords.filter(w => puzzle.pangrams.includes(w)).length;

    const newStats = updateStatsWithDailyGame(
        todayStr,
        score,
        currentRank,
        foundWords.length,
        pangramsCount
    );
    setStats(newStats);

  }, [foundWords, score, puzzle]);


  const handleInput = useCallback((char: string) => {
    // Allow input if it is a valid Macedonian letter, even if not in the puzzle
    if (MACEDONIAN_ALPHABET.includes(char)) {
      setInput(prev => prev + char);
      setMessage('');
    }
  }, []);

  const handleDelete = useCallback(() => {
    setInput(prev => prev.slice(0, -1));
  }, []);

  const toastTimeoutRef = useRef<number | null>(null);
  const shakeTimeoutRef = useRef<number | null>(null);
  const clearInputTimeoutRef = useRef<number | null>(null);

  const showToast = (msg: string, shake = false, durationMs = 1500) => {
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    if (shakeTimeoutRef.current) window.clearTimeout(shakeTimeoutRef.current);
    if (clearInputTimeoutRef.current) window.clearTimeout(clearInputTimeoutRef.current);

    setMessage(msg);
    if (shake) {
      setIsShaking(true);
      shakeTimeoutRef.current = window.setTimeout(() => setIsShaking(false), 500);

      // Auto-delete invalid input after shake
      clearInputTimeoutRef.current = window.setTimeout(() => {
        setInput('');
      }, 600); // 600ms = 500ms shake + 100ms pause
    }
    toastTimeoutRef.current = window.setTimeout(() => setMessage(''), durationMs);
  };

  const handleSubmit = useCallback(() => {
    if (!puzzle || !input) return;

    const currentInput = input.toUpperCase();
    const puzzleLetters = [puzzle.centerLetter, ...puzzle.outerLetters];

    // Check for invalid letters first
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

    // O(1) Lookup using Set
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
      showToast(isPangram ? `ПАНГРАМ! ${randomMessage}!` : `${randomMessage}!`, false, 2500);

      if (willCompleteAllWords) {
        window.setTimeout(() => {
          showToast(
            `Честито! Ги пронајдовте сите ${puzzle.validWords.length} зборови. Секоја Чест!`,
            false,
            5000
          );
          setShowCelebration(true);
          window.setTimeout(() => setShowCelebration(false), 3000);
        }, 500);
      }

    } else {
      showToast("Зборот не е во листата", true);
    }
  }, [puzzle, input, foundWords]);

  const handleShare = async () => {
    if (!puzzle) return;

    const dateStr = new Intl.DateTimeFormat('mk-MK', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()).replace(/\s?г\.?$/, '');
    const currentRank = calculateRank(score, totalPossibleScoreRef.current);
    const totalWords = puzzle.validWords.length;
    const maxScore = totalPossibleScoreRef.current;

    const shareText = `🐝 Македонска пчелка
${dateStr}
Ранг: ${currentRank} 🐝

⬜️ Зборови: ${foundWords.length} / ${totalWords}
🟨 Поени: ${score} / ${maxScore}

https://pcelka.mk`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Македонска пчелка',
          text: shareText,
        });
      } catch (err) {
        // If user cancelled, do nothing. If error, try clipboard.
        if ((err as Error).name !== 'AbortError') {
          try {
            await navigator.clipboard.writeText(shareText);
            showToast("Резултатот е ископиран", false, 2000);
          } catch (clipboardErr) {
            // quiet fail or show error
            console.error(clipboardErr);
          }
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        showToast("Резултатот е ископиран", false, 2000);
      } catch (err) {
        console.error(err);
        showToast("Неуспешно копирање", true);
      }
    }
  };

  const handleShuffle = () => {
    if (!puzzle || isShuffling) return;

    // Start fade out
    setIsShuffling(true);

    // Wait for fade out to complete, then shuffle and fade in
    setTimeout(() => {
      // Improved shuffle: Derangement-like shuffle
      const original = puzzle.outerLetters;
      let shuffled = [...original];

      // Try to shuffle until at least some positions are different
      // (Complete derangement isn't always possible or necessary for small sets,
      // but we want to avoid exact same order)
      let attempts = 0;
      do {
        shuffled = shuffled.sort(() => Math.random() - 0.5);
        attempts++;
      } while (
        attempts < 10 &&
        shuffled.every((char, i) => char === original[i]) // avoid exact match
      );

      setPuzzle({ ...puzzle, outerLetters: shuffled });
      setIsShuffling(false);
    }, 200);
  };

  // Helper to map Latin keys to Cyrillic
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
    if (!hasStarted) return; // Disable keyboard on welcome screen

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

      // Try direct match or mapped match
      const cyrillicKey = mapToCyrillic(key);

      // Allow any valid Macedonian alphabet character
      if (MACEDONIAN_ALPHABET.includes(cyrillicKey)) {
        handleInput(cyrillicKey);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [puzzle, input, foundWords, handleDelete, handleSubmit, handleInput, hasStarted]);

  // Helper to determine letter color in input display
  const getInputLetterClass = (char: string) => {
    if (!puzzle) return 'text-black';
    if (char === puzzle.centerLetter) return 'text-yellow-400';
    if (puzzle.outerLetters.includes(char)) return 'text-black';
    return 'text-gray-300'; // Invalid letters are light gray
  };

  // Helper for date formatting
  const getFormattedDate = () => {
    const dateStr = new Intl.DateTimeFormat('mk-MK', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    // Remove " г." or "г." suffix if present
    return dateStr.replace(/\s?г\.?$/, '');
  };

  // RENDER WELCOME SCREEN
  if (!hasStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f7da21] text-black p-6 relative">
         <div className="flex flex-col items-center max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-500">

           {/* Side View Bee Icon */}
           <div className="w-28 h-28 md:w-36 md:h-36 relative mb-2">
             <img src={`${import.meta.env.BASE_URL}bee.svg`} alt="Bee" className="w-full h-full drop-shadow-sm" />
           </div>

           <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-slab text-black">
             Македонска пчелка
           </h1>

           <p className="text-3xl md:text-4xl font-medium text-gray-900 leading-tight">
             Колку зборови можеш да составиш со 7 букви?
           </p>

           <button
             onClick={() => setHasStarted(true)}
             disabled={isLoading}
             className="mt-10 px-12 py-4 bg-black text-white rounded-full font-bold text-xl hover:bg-gray-800 active:scale-95 transition-all w-48 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {isLoading ? 'Вчитувам...' : 'Играј'}
           </button>

           <div className="mt-16 text-center space-y-2">
             <p className="font-extrabold text-lg text-black">
               {getFormattedDate()}
             </p>
             <p className="text-sm font-bold text-black">Едитор: Јован</p>
           </div>
        </div>
      </div>
    );
  }

  // MAIN GAME SCREEN (Only rendered if hasStarted is true)
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen max-w-6xl mx-auto md:px-6 select-none overflow-hidden bg-white">

      {/* Left Column: Game Area */}
      <div className="flex-1 flex flex-col px-4 py-2 md:py-6 h-full overflow-y-auto overflow-x-hidden md:border-r md:border-gray-100 md:pr-8">
        <header className="flex justify-between items-center mb-2 md:mb-6 border-b pb-2 md:pb-4">
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-slab font-bold tracking-tight text-gray-900">Македонска пчелка</h1>
            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">Дневен предизвик</span>
          </div>
          <div className="flex flex-col items-end">
             <div className="flex items-center gap-3 mb-1">
               <button
                 onClick={() => setIsStatsOpen(true)}
                 className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                 title="Статистика"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                 </svg>
               </button>
               <button
                 onClick={handleShare}
                 className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                 title="Сподели"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                 </svg>
               </button>
               <div className="text-xs md:text-sm font-bold text-gray-600">
                 {new Intl.DateTimeFormat('mk-MK', { day: 'numeric', month: 'long', timeZone: 'Europe/Amsterdam' }).format(new Date())}
               </div>
             </div>
          </div>
        </header>

        <ScoreBoard
          score={score}
          totalPossibleScore={totalPossibleScore}
          wordsFound={foundWords.length}
          totalWords={puzzle?.validWords.length || 0}
        />

        {/* Mobile-only Collapsible Word List (Moved to top on mobile as per request) */}
        <div className="mb-2 md:hidden w-full max-w-md mx-auto px-2">
          <div
            onClick={() => setShowFoundWords(!showFoundWords)}
            className="cursor-pointer border-2 border-gray-100 rounded-xl px-4 py-2 flex justify-between items-center group bg-gray-50 min-h-[42px]"
          >
            <div className="flex items-center gap-2 overflow-hidden">
               <span className="font-bold text-gray-600 text-xs truncate">
                 {foundWords.length > 0
                   ? [...foundWords].sort((a, b) => a.localeCompare(b)).join('  ')
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
                  words={foundWords}
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
              />
            )}
          </div>

          <div className="flex gap-4 md:gap-6 mt-2 md:mt-6 w-full justify-center items-center">
            <button
              onClick={handleDelete}
              className="px-6 py-3 border-2 border-gray-200 rounded-full font-bold text-sm text-gray-800 hover:bg-gray-50 active:scale-95 transition-all w-28 text-center"
            >
              Избриши
            </button>

            <button
              onClick={handleShuffle}
              className="p-3 border-2 border-gray-200 rounded-full hover:bg-gray-50 active:scale-90 transition-all flex items-center justify-center w-12 h-12"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            <button
              onClick={handleSubmit}
              disabled={!input}
              className="px-6 py-3 border-2 border-gray-200 rounded-full font-bold text-sm text-gray-800 hover:bg-gray-50 active:scale-95 transition-all w-28 text-center disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              Внеси
            </button>
          </div>

          <div className="flex w-full justify-center items-center mt-4">
            <button
               onClick={() => setIsAboutOpen(true)}
               className="px-6 py-3 border-2 border-gray-200 rounded-full font-bold text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:scale-95 transition-all w-40 text-center"
            >
              За играта
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Desktop Word List */}
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
                    words={foundWords}
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
        stats={stats}
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
