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
        <div className="flex flex-col justify-center">
          <span className="text-base font-black tracking-tight text-white leading-tight">
            Tidy Corporation <span className="text-[#FF7F00]">Ltd</span>
          </span>
          <span className="text-[10px] font-mono text-cyan-400 tracking-widest uppercase">
            AI Property OS
          </span>
        </div>
      )}
    </div>
  );
};
