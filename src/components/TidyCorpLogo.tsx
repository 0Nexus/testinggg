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
    <div className={`flex items-center space-x-3 select-none ${className}`}>
      {/* Precision Vector SVG Logo referencing /favicon.svg */}
      <img
        src="/favicon.svg"
        alt="Tidy Corp Logo"
        className="w-full h-full object-contain filter drop-shadow-md"
      />

      {showText && (
        <span className="text-sm sm:text-base font-black tracking-tight text-white whitespace-nowrap">
          tidy corporation LTD
        </span>
      )}
    </div>
  );
};
