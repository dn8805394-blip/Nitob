import React from 'react';

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#09090b]">
      {/* 1. Deep Modern Fluid Aurora Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top-Left Subtle Violet Glow */}
        <div
          className="absolute -top-[20%] -left-[15%] w-[55vw] h-[55vw] rounded-full blur-[140px] opacity-25 bg-gradient-to-br from-indigo-950/60 via-purple-950/40 to-transparent"
        />

        {/* Bottom-Right Subtle Warm Accent Glow */}
        <div
          className="absolute -bottom-[20%] -right-[15%] w-[50vw] h-[50vw] rounded-full blur-[150px] opacity-20 bg-gradient-to-tl from-zinc-800/40 via-zinc-900/30 to-transparent"
        />
      </div>

      {/* 2. Top Spotlight Horizon Beam */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[240px] opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.01) 50%, transparent 80%)',
        }}
      />

      {/* 3. Clean Subtle Grid Texture with Mask */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 75% 65% at 50% 45%, #000 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 75% 65% at 50% 45%, #000 30%, transparent 80%)',
        }}
      />

      {/* 4. Ambient Vignette Borders */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />
    </div>
  );
};
