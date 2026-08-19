import React, { useState, useRef } from 'react';
import { 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Music as MusicIcon, 
  Download, 
  Maximize2, 
  Play, 
  Pause, 
  Volume2, 
  ExternalLink,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { CreativeMediaAttachment } from '../types';

interface CreativeMediaCardProps {
  media: CreativeMediaAttachment;
}

export const CreativeMediaCard: React.FC<CreativeMediaCardProps> = ({ media }) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Synthesize musical ambient melodic loop using Web Audio API for Music mode
  const togglePlayMusic = () => {
    if (isPlayingAudio) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      setIsPlayingAudio(false);
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const pentatonic = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25]; // C D E G A C
      let step = 0;

      const playChord = () => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') return;
        const now = ctx.currentTime;
        const noteFreq = pentatonic[step % pentatonic.length];
        step++;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(noteFreq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.06, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.85);
      };

      playChord();
      intervalRef.current = window.setInterval(playChord, 450);
      setIsPlayingAudio(true);
    } catch {
      setIsPlayingAudio(false);
    }
  };

  const handleDownload = (url?: string, filename = 'nitob-creative.png') => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noreferrer noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="mt-3 w-full rounded-2xl overflow-hidden border border-white/10 bg-[#16181e]/90 shadow-xl backdrop-blur-xl">
      {/* 1. Image Media Card */}
      {media.type === 'image' && (
        <div className="flex flex-col">
          <div className="relative group overflow-hidden bg-black/40 aspect-square max-h-[380px] flex items-center justify-center">
            {media.url ? (
              <img
                src={media.url}
                alt={media.prompt}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-t-2xl transition-transform duration-500 group-hover:scale-[1.02] cursor-pointer"
                onClick={() => setShowFullImage(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-gray-400 gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
                <span className="text-xs">Đang khởi tạo tác phẩm DeepAI...</span>
              </div>
            )}

            {/* Hover Actions */}
            {media.url && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
                <div className="text-xs text-white line-clamp-1 max-w-[70%] font-medium">
                  {media.prompt}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFullImage(true)}
                    className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-colors"
                    title="Phóng to ảnh"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(media.url, 'deepai-image.jpg')}
                    className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-lg transition-colors"
                    title="Tải về máy"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="p-3.5 flex items-center justify-between border-t border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300">
                <ImageIcon className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs text-gray-300 font-medium">
                {media.provider || 'AI Studio Image Engine'}
              </span>
            </div>
            {media.url && (
              <a
                href={media.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 transition-colors"
              >
                <span>Mở ảnh gốc</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* 2. Video Media Card */}
      {media.type === 'video' && (
        <div className="flex flex-col">
          <div className="relative bg-black/60 aspect-video w-full rounded-t-2xl overflow-hidden">
            <video
              src={media.url}
              poster={media.thumbnailUrl}
              controls
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-3.5 flex items-center justify-between border-t border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-pink-500/20 text-pink-300">
                <VideoIcon className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs text-gray-300 font-medium">{media.title || 'Video AI Studio'}</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Music Media Card */}
      {media.type === 'music' && (
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlayMusic}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white transition-all cursor-pointer shadow-lg ${
                  isPlayingAudio
                    ? 'bg-amber-500 shadow-amber-500/30 scale-105'
                    : 'bg-gradient-to-tr from-purple-600 to-indigo-600 hover:scale-105 shadow-purple-600/30'
                }`}
              >
                {isPlayingAudio ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>

              <div>
                <h4 className="text-sm font-semibold text-white tracking-tight">
                  {media.title || 'Bản hòa âm sáng tạo'}
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                  <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-purple-300">
                    {media.audioData?.genre || 'Ambient'}
                  </span>
                  <span>BPM: {media.audioData?.bpm || 120}</span>
                  <span>•</span>
                  <span>{media.audioData?.duration || '01:45'}</span>
                </div>
              </div>
            </div>

            {/* Visualizer bars */}
            <div className="flex items-center gap-1 h-6">
              {[40, 75, 100, 60, 90, 45, 80, 55, 95, 35].map((h, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-300 ${
                    isPlayingAudio ? 'bg-gradient-to-t from-purple-500 to-amber-400 animate-pulse' : 'bg-white/20'
                  }`}
                  style={{
                    height: isPlayingAudio ? `${Math.max(25, (h * Math.random()) + 20)}%` : `${h * 0.35}%`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Lyrics / Prompt transcript */}
          {media.audioData?.lyrics && (
            <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-xs text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">
              {media.audioData.lyrics}
            </div>
          )}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {showFullImage && media.url && (
        <div
          onClick={() => setShowFullImage(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img
            src={media.url}
            alt={media.prompt}
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain"
          />
        </div>
      )}
    </div>
  );
};
