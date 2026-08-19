import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface HalloweenIntroProps {
  onComplete: () => void;
}

export const HalloweenIntro: React.FC<HalloweenIntroProps> = ({ onComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Play audio chime synthesized with Web Audio API for an enchanting chime
  const playEnchantingChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.12);
        
        gain.gain.setValueAtTime(0.001, now + index * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.12, now + index * 0.12 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.12 + 1.2);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + index * 0.12);
        osc.stop(now + index * 0.12 + 1.3);
      });
    } catch {
      // Audio not supported or allowed; silently ignore
    }
  };

  const handleOpenCurtains = () => {
    if (isOpen) return;
    setIsOpen(true);
    playEnchantingChime();
    setTimeout(() => {
      setIsDismissed(true);
      onComplete();
    }, 1800);
  };

  // Optional auto-open after 4.5 seconds if user doesn't click
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen) {
        handleOpenCurtains();
      }
    }, 4500);
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (isDismissed) return null;

  return (
    <AnimatePresence>
      <div 
        id="halloween-curtain-intro"
        className="fixed inset-0 z-50 overflow-hidden select-none pointer-events-auto flex items-center justify-center"
      >
        {/* Left Velvet Curtain */}
        <motion.div
          className="absolute top-0 bottom-0 left-0 w-1/2 curtain-fabric-left z-20 flex items-center justify-end"
          initial={{ x: 0 }}
          animate={{ x: isOpen ? '-105%' : 0 }}
          transition={{ duration: 1.6, ease: [0.25, 1, 0.5, 1] }}
        >
          {/* Folds & Golden Tassel Cord */}
          <div className="absolute top-0 bottom-0 right-0 w-6 bg-gradient-to-r from-transparent via-amber-400/20 to-amber-500/40" />
          <div className="absolute top-1/2 right-4 -translate-y-1/2 hidden md:flex flex-col items-center opacity-70">
            <div className="w-1.5 h-32 bg-amber-400/80 rounded-full shadow-lg" />
            <div className="w-6 h-10 bg-amber-500/90 rounded-full shadow-md mt-1" />
          </div>
        </motion.div>

        {/* Right Velvet Curtain */}
        <motion.div
          className="absolute top-0 bottom-0 right-0 w-1/2 curtain-fabric-right z-20 flex items-center justify-start"
          initial={{ x: 0 }}
          animate={{ x: isOpen ? '105%' : 0 }}
          transition={{ duration: 1.6, ease: [0.25, 1, 0.5, 1] }}
        >
          {/* Folds & Golden Tassel Cord */}
          <div className="absolute top-0 bottom-0 left-0 w-6 bg-gradient-to-l from-transparent via-amber-400/20 to-amber-500/40" />
          <div className="absolute top-1/2 left-4 -translate-y-1/2 hidden md:flex flex-col items-center opacity-70">
            <div className="w-1.5 h-32 bg-amber-400/80 rounded-full shadow-lg" />
            <div className="w-6 h-10 bg-amber-500/90 rounded-full shadow-md mt-1" />
          </div>
        </motion.div>

        {/* Center Stage Presentation Container (fades as curtains part) */}
        <motion.div
          className="relative z-30 flex flex-col items-center text-center px-6 max-w-xl"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: isOpen ? 0 : 1, scale: isOpen ? 1.08 : 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Glowing Halloween Pumpkins & Seasonal Badge */}
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="text-4xl md:text-5xl pumpkin-flicker">🎃</div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-xl shadow-orange-500/20">
              <Sparkles className="w-6 h-6 text-amber-100 animate-spin" style={{ animationDuration: '8s' }} />
            </div>
            <div className="text-4xl md:text-5xl pumpkin-flicker" style={{ animationDelay: '1.2s' }}>🎃</div>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-3 font-['Outfit'] drop-shadow-md">
            Chào mừng đến với <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-200">Nitob</span>
          </h1>

          <p className="text-sm md:text-base text-amber-100/80 mb-8 max-w-md font-light leading-relaxed">
            Mùa lễ hội ngập tràn cảm hứng. Hãy mở màn để khám phá trải nghiệm trí tuệ nhân tạo hiện đại và tinh tế.
          </p>

          {/* Interactive Open Button */}
          <button
            id="open-curtain-btn"
            onClick={handleOpenCurtains}
            className="group relative inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-medium text-base shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
          >
            <span>Mở màn trải nghiệm</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="mt-5 flex items-center gap-2 text-xs text-amber-200/50">
            <span>🍂 Lá vàng rơi êm dịu • Mở màn tự động trong giây lát...</span>
          </div>
        </motion.div>

        {/* Ambient Floating Pumpkins & Leaves inside Intro */}
        <div className="absolute inset-0 pointer-events-none z-25 overflow-hidden">
          <div className="absolute bottom-6 left-8 text-5xl md:text-6xl pumpkin-flicker opacity-80">🎃</div>
          <div className="absolute bottom-6 right-8 text-5xl md:text-6xl pumpkin-flicker opacity-80" style={{ animationDelay: '1.8s' }}>🎃</div>
          <div className="absolute top-12 left-1/4 text-2xl animate-bounce opacity-60">🍁</div>
          <div className="absolute top-20 right-1/4 text-3xl animate-bounce opacity-60" style={{ animationDelay: '0.9s' }}>🍂</div>
        </div>
      </div>
    </AnimatePresence>
  );
};
