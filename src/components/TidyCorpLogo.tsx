import React from 'react';

interface TidyCorpLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const TidyCorpLogo: React.FC<TidyCorpLogoProps> = ({
  className = 'h-10 w-10',
  showText = false,
}) => {
  return (
    <div className="flex items-center space-x-1.5 sm:space-x-2 select-none">
      {/* Precision Vector SVG Logo referencing /favicon.svg */}
      <img
        src="/favicon.svg"
        alt="Tidy Corporation Ltd Logo"
        className={`${className} object-contain filter drop-shadow-md shrink-0`}
      />

      {showText && (
        <span className="text-sm sm:text-base font-black tracking-tight text-white whitespace-nowrap">
          Tidy Corporation Ltd
        </span>
      )}
    </div>
  );
};
