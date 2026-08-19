import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface HalloweenCurtainIntroProps {
  onComplete: () => void;
}

export const HalloweenCurtainIntro: React.FC<HalloweenCurtainIntroProps> = ({ onComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Play subtle welcoming chime strictly on user gesture (avoids browser autoplay warnings)
  const playGentleChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.1);
        
        gain.gain.setValueAtTime(0.001, now + index * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.08, now + index * 0.1 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.1 + 0.8);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + index * 0.1);
        osc.stop(now + index * 0.1 + 0.85);
      });
    } catch {
      // Ignore if audio is disabled
    }
  };

  const handleOpen = () => {
    if (isOpen) return;
    setIsOpen(true);
    playGentleChime();
    setTimeout(() => {
      setIsDismissed(true);
      onComplete();
    }, 1600);
  };

  if (isDismissed) return null;

  return (
    <AnimatePresence>
      <div 
        id="halloween-curtain-intro"
        className="fixed inset-0 z-50 overflow-hidden select-none pointer-events-auto flex items-center justify-center bg-black"
      >
        {/* Left Velvet Curtain */}
        <motion.div
          className="absolute top-0 bottom-0 left-0 w-1/2 curtain-fabric-left z-20 flex items-center justify-end"
          initial={{ x: 0 }}
          animate={{ x: isOpen ? '-105%' : 0 }}
          transition={{ duration: 1.5, ease: [0.25, 1, 0.5, 1] }}
        >
          {/* Gold Trim & Tassel Accent */}
          <div className="absolute top-0 bottom-0 right-0 w-4 bg-gradient-to-r from-transparent via-amber-400/20 to-amber-500/40" />
          <div className="absolute top-1/2 right-4 -translate-y-1/2 hidden md:flex flex-col items-center opacity-75">
            <div className="w-1.5 h-28 bg-amber-400/80 rounded-full shadow-lg" />
            <div className="w-5 h-8 bg-amber-500/90 rounded-full shadow-md mt-1" />
          </div>
        </motion.div>

        {/* Right Velvet Curtain */}
        <motion.div
          className="absolute top-0 bottom-0 right-0 w-1/2 curtain-fabric-right z-20 flex items-center justify-start"
          initial={{ x: 0 }}
          animate={{ x: isOpen ? '105%' : 0 }}
          transition={{ duration: 1.5, ease: [0.25, 1, 0.5, 1] }}
        >
          {/* Gold Trim & Tassel Accent */}
          <div className="absolute top-0 bottom-0 left-0 w-4 bg-gradient-to-l from-transparent via-amber-400/20 to-amber-500/40" />
          <div className="absolute top-1/2 left-4 -translate-y-1/2 hidden md:flex flex-col items-center opacity-75">
            <div className="w-1.5 h-28 bg-amber-400/80 rounded-full shadow-lg" />
            <div className="w-5 h-8 bg-amber-500/90 rounded-full shadow-md mt-1" />
          </div>
        </motion.div>

        {/* Center Presentation Stage */}
        <motion.div
          className="relative z-30 flex flex-col items-center text-center px-6 max-w-xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: isOpen ? 0 : 1, scale: isOpen ? 1.05 : 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* Halloween Glowing Pumpkins & Icon Badge */}
          <div className="flex items-center justify-center gap-5 mb-5">
            <div className="text-4xl md:text-5xl pumpkin-flicker">🎃</div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-xl shadow-orange-500/25">
              <Sparkles className="w-6 h-6 text-amber-100 animate-spin" style={{ animationDuration: '9s' }} />
            </div>
            <div className="text-4xl md:text-5xl pumpkin-flicker" style={{ animationDelay: '1.2s' }}>🎃</div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-3 font-['Outfit'] drop-shadow-md">
            Chào mừng đến với <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-200">Nitob</span>
          </h1>

          <p className="text-sm md:text-base text-amber-100/80 mb-7 max-w-md font-light leading-relaxed">
            Mở màn để bắt đầu không gian trò chuyện cùng trợ lý trí tuệ nhân tạo tinh gọn.
          </p>

          {/* Interactive Open Curtain Button */}
          <button
            id="open-curtain-btn"
            onClick={handleOpen}
            className="group relative inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-medium text-base shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
          >
            <span>Kéo rèm mở màn</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        {/* Ambient Corner Pumpkins */}
        <div className="absolute inset-0 pointer-events-none z-25 overflow-hidden">
          <div className="absolute bottom-6 left-8 text-4xl md:text-5xl pumpkin-flicker opacity-80">🎃</div>
          <div className="absolute bottom-6 right-8 text-4xl md:text-5xl pumpkin-flicker opacity-80" style={{ animationDelay: '1.8s' }}>🎃</div>
        </div>
      </div>
    </AnimatePresence>
  );
};
