import React from 'react';

interface FoundWordsListProps {
  words: string[];
  pangrams: string[];
  isMobile?: boolean; // Determines styling for mobile vs desktop
}

const FoundWordsList: React.FC<FoundWordsListProps> = ({ words, pangrams, isMobile = false }) => {
  if (words.length === 0) {
    if (isMobile) {
      return <p className="text-gray-400 col-span-full italic text-xs font-bold">Започни со игра...</p>;
    }
    // Desktop empty state (optional, or just show empty list)
    return null;
  }

  const sortedWords = [...words].sort((a, b) => a.localeCompare(b));

  return (
    <>
      {sortedWords.map((word, i) => (
        <div
          key={i}
          className={`
            ${isMobile
              ? 'py-1 text-sm border-b border-gray-50'
              : 'py-2 px-1 text-base border-b border-gray-100 last:border-0'
            }
            capitalize
            ${pangrams.includes(word) ? 'font-black text-yellow-600' : 'text-gray-700 font-bold'}
          `}
        >
          {word.toLowerCase()} {pangrams.includes(word) && '★'}
        </div>
      ))}
    </>
  );
};

export default FoundWordsList;

