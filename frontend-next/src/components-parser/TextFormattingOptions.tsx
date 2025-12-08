import React from 'react';

interface TextFormattingOptionsProps {
  inputMode: string;
  handleModeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const TextFormattingOptions: React.FC<TextFormattingOptionsProps> = ({ inputMode, handleModeChange }) => {
  return (
    <div className="flex flex-col space-y-2 mb-4">
      <span className="text-sm font-bold text-brand-dark uppercase tracking-wider">Input Mode</span>
      <div className="flex p-1 bg-brand-cream-dark/50 rounded-lg border-2 border-brand-dark w-fit">
        <label className="cursor-pointer relative z-10">
          <input
            type="radio"
            value="book"
            checked={inputMode === 'book'}
            onChange={handleModeChange}
            className="hidden"
          />
          <div
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 font-bold border-2 ${inputMode === 'book'
                ? 'bg-brand-blue text-white border-brand-dark shadow-hard'
                : 'bg-transparent text-brand-dark border-transparent hover:bg-black/5'
              }`}
          >
            {/* Icon for Book can go here if imported */}
            <span>Book / Paragraph</span>
          </div>
        </label>

        <label className="cursor-pointer relative z-10 ml-2">
          <input
            type="radio"
            value="lyrics"
            checked={inputMode === 'lyrics'}
            onChange={handleModeChange}
            className="hidden"
          />
          <div
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 font-bold border-2 ${inputMode === 'lyrics'
                ? 'bg-brand-blue text-white border-brand-dark shadow-hard'
                : 'bg-transparent text-brand-dark border-transparent hover:bg-black/5'
              }`}
          >
            {/* Icon for Lyrics can go here */}
            <span>Lyrics / Line by Line</span>
          </div>
        </label>
      </div>
    </div>
  );
};

export default TextFormattingOptions;
