import React from 'react';

interface NitobLogoProps {
  className?: string;
  size?: number;
}

export const NitobLogo: React.FC<NitobLogoProps> = ({ className = 'w-6 h-6', size }) => {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      <rect width="32" height="32" rx="8" fill="#171717" />
      <rect width="32" height="32" rx="8" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1" />
      {/* Sleek Minimalist Geometric 'N' Monogram */}
      <path
        d="M9.5 22.5V9.5H12.5L19.5 19.2V9.5H22.5V22.5H19.5L12.5 12.8V22.5H9.5Z"
        fill="url(#nitob_grad)"
      />
      <defs>
        <linearGradient id="nitob_grad" x1="9.5" y1="9.5" x2="22.5" y2="22.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="0.6" stopColor="#E0E0E0" />
          <stop offset="1" stopColor="#A3A3A3" />
        </linearGradient>
      </defs>
    </svg>
  );
};
