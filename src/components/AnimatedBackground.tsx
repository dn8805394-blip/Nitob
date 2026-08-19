import React, { useMemo, useEffect, useRef } from 'react';

interface AnimatedBackgroundProps {
  leavesEnabled?: boolean;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  leavesEnabled = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Modern ambient floating particles simulation on Canvas (ultra-lightweight, 60fps)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle nodes
    const particleCount = Math.min(Math.floor((width * height) / 28000), 45);
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: Math.random() * 1.6 + 0.6,
      opacity: Math.random() * 0.45 + 0.15,
      pulseSpeed: Math.random() * 0.02 + 0.008,
      pulseOffset: Math.random() * Math.PI * 2,
    }));

    let tick = 0;

    const render = () => {
      tick += 1;
      ctx.clearRect(0, 0, width, height);

      // Draw connecting energy lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            const alpha = (1 - dist / 130) * 0.12;
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particle points
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around boundaries
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const currentOpacity =
          p.opacity * (0.7 + 0.3 * Math.sin(tick * p.pulseSpeed + p.pulseOffset));

        ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Festive seasonal leaves if enabled
  const leaves = useMemo(() => {
    const symbols = ['🍂', '🍁', '🍃', '✨'];
    return Array.from({ length: 14 }, (_, i) => ({
      id: i,
      symbol: symbols[i % symbols.length],
      left: `${(i * 7.2 + 3) % 95}%`,
      delay: `${(i * 1.3) % 15}s`,
      duration: `${14 + (i % 5) * 2.8}s`,
      size: `${13 + (i % 4) * 3}px`,
      opacity: 0.14 + (i % 3) * 0.06,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#09090b]">
      {/* 1. Deep Modern Fluid Aurora Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top-Left Indigo Violet Glow Orb */}
        <div
          className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] rounded-full blur-[140px] opacity-40 bg-gradient-to-br from-indigo-900/60 via-purple-900/40 to-transparent animate-aurora-1"
        />

        {/* Bottom-Right Warm Amber / Rose Core Orb */}
        <div
          className="absolute -bottom-[15%] -right-[10%] w-[50vw] h-[50vw] rounded-full blur-[150px] opacity-35 bg-gradient-to-tl from-amber-950/60 via-orange-950/40 to-transparent animate-aurora-2"
        />

        {/* Center Floating Luminous Accent Orb */}
        <div
          className="absolute top-[35%] left-[30%] w-[40vw] h-[40vw] rounded-full blur-[160px] opacity-25 bg-gradient-to-tr from-cyan-950/40 via-blue-950/30 to-purple-950/30 animate-aurora-3"
        />
      </div>

      {/* 2. Top Spotlight Horizon Beam */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[280px] opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.03) 45%, transparent 70%)',
        }}
      />

      {/* 3. Subtle Futuristic Matrix Grid with Radial Mask Fade */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%, #000 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%, #000 30%, transparent 80%)',
        }}
      />

      {/* 4. Interactive Starlight / Constellation Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-65 pointer-events-none"
      />

      {/* 5. Ambient Vignette Borders */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

      {/* 6. Gentle Floating Festive Elements (if enabled) */}
      {leavesEnabled && (
        <div className="absolute inset-0 pointer-events-none">
          {leaves.map((leaf) => (
            <div
              key={leaf.id}
              className="absolute"
              style={{
                left: leaf.left,
                top: '-40px',
                fontSize: leaf.size,
                opacity: leaf.opacity,
                animation: `leafDrift ${leaf.duration} linear infinite`,
                animationDelay: leaf.delay,
              }}
            >
              {leaf.symbol}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
