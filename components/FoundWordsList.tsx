import React from 'react';

interface FoundWordsListProps {
  words: string[];
  pangrams: string[];
  isMobile?: boolean;
}

const FoundWordsList: React.FC<FoundWordsListProps> = ({ words, pangrams, isMobile = false }) => {
  if (words.length === 0) {
    if (isMobile) {
      return <p className="text-gray-400 col-span-full italic text-xs font-bold">Започни со игра...</p>;
    }
    return null;
  }

  // Note: words are expected to be pre-sorted by the parent component
  return (
    <>
      {words.map((word) => (
        <div
          key={word}
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

export default React.memo(FoundWordsList);
