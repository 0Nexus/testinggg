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
      {/* Precision Vector SVG Logo matching Tidy Corp 3D Emblem */}
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        <defs>
          {/* Top-Left Blue Bar Gradient */}
          <linearGradient id="tidyBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2B80FF" />
            <stop offset="100%" stopColor="#0052C6" />
          </linearGradient>

          {/* Central Stem Blue-to-Teal Gradient */}
          <linearGradient id="tidyTealStemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00A3FF" />
            <stop offset="50%" stopColor="#00BBA5" />
            <stop offset="100%" stopColor="#25D391" />
          </linearGradient>

          {/* Right Green Block Gradient */}
          <linearGradient id="tidyGreenBlockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2EEA92" />
            <stop offset="100%" stopColor="#12A864" />
          </linearGradient>

          {/* Orange Accent Top Bar */}
          <linearGradient id="tidyOrangeAccent" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF8C00" />
            <stop offset="100%" stopColor="#FF5500" />
          </linearGradient>

          {/* Bevel Overlay for 3D Effect */}
          <linearGradient id="bevelOverlay" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
          </linearGradient>

          <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Dark Frame Container (Rounded Square) */}
        <rect x="5" y="5" width="190" height="190" rx="36" fill="#0A1128" />
        <rect x="5" y="5" width="190" height="190" rx="36" stroke="#1E293B" strokeWidth="2" />

        <g transform="translate(25, 25)">
          {/* 1. TOP LEFT BLUE BLOCK */}
          <path
            d="M 12 25 
               C 12 20, 16 16, 22 16 
               L 82 16 
               L 115 50 
               L 22 50 
               C 16 50, 12 46, 12 40 
               Z"
            fill="url(#tidyBlueGrad)"
          />
          <path
            d="M 12 25 L 82 16 L 115 50 L 22 50 Z"
            fill="url(#bevelOverlay)"
          />

          {/* 2. TOP RIGHT GREEN HORIZONTAL ARM */}
          <path
            d="M 118 16 
               L 142 16 
               C 148 16, 152 20, 152 26 
               L 152 50 
               L 82 50 
               Z"
            fill="url(#tidyGreenBlockGrad)"
          />
          {/* Orange Accent Stripe on top right corner */}
          <path
            d="M 118 16 
               L 142 16 
               C 148 16, 150 18, 151 21 
               L 151 24 
               L 118 24 
               Z"
            fill="url(#tidyOrangeAccent)"
          />

          {/* 3. MAIN CENTRAL STEM (T & C Fold) */}
          <path
            d="M 82 22 
               L 118 58 
               L 118 120 
               C 118 128, 114 134, 107 140 
               L 82 160 
               C 76 165, 70 162, 70 152 
               L 70 60 
               C 70 48, 74 32, 82 22 
               Z"
            fill="url(#tidyTealStemGrad)"
          />
          <path
            d="M 82 22 L 118 58 L 118 120 L 107 140 L 82 160 Z"
            fill="url(#bevelOverlay)"
          />

          {/* 4. LOWER RIGHT GREEN BLOCK */}
          <path
            d="M 125 64 
               L 148 64 
               C 151 64, 153 66, 153 70 
               L 153 100 
               C 153 104, 150 110, 145 116 
               L 125 138 
               Z"
            fill="url(#tidyGreenBlockGrad)"
          />
          <path
            d="M 125 64 L 148 64 L 153 100 L 125 138 Z"
            fill="url(#bevelOverlay)"
          />
        </g>
      </svg>

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
