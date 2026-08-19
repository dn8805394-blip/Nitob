import React, { useRef, useEffect, useState } from 'react';
import { 
  ArrowUp, 
  Square, 
  Mic, 
  MicOff, 
  Paperclip, 
  Image as ImageIcon,
  Video as VideoIcon,
  Music as MusicIcon,
  Sparkles,
  Zap,
  X,
  ChevronDown,
  Check,
  Palette
} from 'lucide-react';
import { AppMode, CreativeMediaType } from '../types';

interface PromptInputProps {
  input: string;
  setInput: (value: string) => void;
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  activeCreativeType: CreativeMediaType;
  setActiveCreativeType: (type: CreativeMediaType) => void;
  onSubmit: (e: React.FormEvent) => void;
  onStop: () => void;
  isLoading: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  input,
  setInput,
  mode,
  setMode,
  activeCreativeType,
  setActiveCreativeType,
  onSubmit,
  onStop,
  isLoading,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<{ name: string; type: string } | null>(null);
  const [isModeOpen, setIsModeOpen] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsModeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && (input.trim() || selectedAttachment)) {
        onSubmit(e);
        setSelectedAttachment(null);
      }
    }
  };

  // Speech to text integration
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = 
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition || 
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Trình duyệt của bạn chưa hỗ trợ nhận dạng giọng nói trực tiếp.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(input ? `${input} ${transcript}` : transcript);
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedAttachment({
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'file',
      });
    }
  };

  const isCreativeMode = mode === 'creative';

  // Dynamic placeholder based on mode and creative type
  const getPlaceholder = () => {
    if (isCreativeMode) {
      if (activeCreativeType === 'image') return 'Mô tả hình ảnh bạn muốn tạo với DeepAI (VD: Phi hành gia trên sao hỏa)...';
      if (activeCreativeType === 'video') return 'Mô tả kịch bản video bạn muốn tạo (VD: Thành phố tương lai ban đêm)...';
      if (activeCreativeType === 'music') return 'Mô tả phong cách âm nhạc hoặc bài hát (VD: Nhạc lofi thư giãn đêm muộn)...';
      return 'Nhập ý tưởng sáng tạo tại đây...';
    }
    return 'Enter a prompt here...';
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-6 relative">
      {/* 3 Creative Mode Sub-Tools (Image, Video, Music) with Liquid Glass Aesthetic */}
      {isCreativeMode && (
        <div className="flex items-center gap-2 mb-2.5 px-2 animate-fade-in select-none">
          <span className="text-[11px] font-medium text-purple-300 flex items-center gap-1.5 mr-1 drop-shadow-sm">
            <Palette className="w-3.5 h-3.5" />
            <span>Công cụ Creative:</span>
          </span>

          {/* 1. Image Tool */}
          <button
            type="button"
            onClick={() => setActiveCreativeType('image')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all ${
              activeCreativeType === 'image'
                ? 'liquid-glass-active-purple text-white scale-105 shadow-md shadow-purple-500/20'
                : 'liquid-glass-pill text-gray-300 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-purple-300" />
            <span>Image (DeepAI)</span>
          </button>

          {/* 2. Video Tool */}
          <button
            type="button"
            onClick={() => setActiveCreativeType('video')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all ${
              activeCreativeType === 'video'
                ? 'liquid-glass-active-pink text-white scale-105 shadow-md shadow-pink-500/20'
                : 'liquid-glass-pill text-gray-300 hover:text-white'
            }`}
          >
            <VideoIcon className="w-3.5 h-3.5 text-pink-300" />
            <span>Video</span>
          </button>

          {/* 3. Music Tool */}
          <button
            type="button"
            onClick={() => setActiveCreativeType('music')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all ${
              activeCreativeType === 'music'
                ? 'liquid-glass-active-amber text-white scale-105 shadow-md shadow-amber-500/20'
                : 'liquid-glass-pill text-gray-300 hover:text-white'
            }`}
          >
            <MusicIcon className="w-3.5 h-3.5 text-amber-300" />
            <span>Music</span>
          </button>
        </div>
      )}

      {/* Attachment Pill if any */}
      {selectedAttachment && (
        <div className="flex items-center gap-2 mb-2 px-3.5 py-1.5 rounded-full liquid-glass-pill w-fit text-xs text-purple-200">
          {selectedAttachment.type === 'image' ? (
            <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
          ) : (
            <Paperclip className="w-3.5 h-3.5 text-purple-400" />
          )}
          <span className="truncate max-w-[200px]">{selectedAttachment.name}</span>
          <button
            onClick={() => setSelectedAttachment(null)}
            className="p-0.5 hover:text-white text-gray-400"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Ultra-sleek Liquid Glass Bar */}
      <form
        onSubmit={(e) => {
          onSubmit(e);
          setSelectedAttachment(null);
        }}
        className="w-full liquid-glass-bar rounded-full px-3.5 py-2 flex items-center gap-2 transition-all"
      >
        {/* Mode Selector Pill inside Prompt Bar */}
        <div className="relative flex-shrink-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsModeOpen(!isModeOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer select-none ${
              isCreativeMode
                ? 'liquid-glass-active-purple text-purple-100'
                : 'liquid-glass-pill text-gray-200 hover:text-white'
            }`}
            title="Chọn chế độ hoạt động"
          >
            {isCreativeMode ? (
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
            )}
            <span>{isCreativeMode ? 'Creative' : 'Lite'}</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          {/* Mode Dropdown Popover with Liquid Glass Styling */}
          {isModeOpen && (
            <div className="absolute bottom-full left-0 mb-3 w-64 p-2.5 rounded-3xl liquid-glass-bar shadow-2xl z-50 space-y-1.5">
              <div className="px-2.5 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Chế độ hoạt động
              </div>

              {/* Mode: Lite */}
              <div
                onClick={() => {
                  setMode('standard');
                  setIsModeOpen(false);
                }}
                className={`flex items-center justify-between p-2.5 rounded-2xl text-xs cursor-pointer transition-all ${
                  !isCreativeMode 
                    ? 'bg-white/10 text-white shadow-inner' 
                    : 'hover:bg-white/5 text-gray-300 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5 fill-amber-400/30" />
                  </div>
                  <div>
                    <div className="font-medium flex items-center gap-1.5">
                      <span>Nitob Lite</span>
                    </div>
                    <div className="text-[10px] text-gray-400">Trò chuyện chuẩn, đầy đủ</div>
                  </div>
                </div>
                {!isCreativeMode && <Check className="w-3.5 h-3.5 text-amber-400" />}
              </div>

              {/* Mode: Creative (DeepAI Image, Video, Music) */}
              <div
                onClick={() => {
                  setMode('creative');
                  setIsModeOpen(false);
                }}
                className={`flex items-center justify-between p-2.5 rounded-2xl text-xs cursor-pointer transition-all ${
                  isCreativeMode 
                    ? 'liquid-glass-active-purple text-white shadow-inner' 
                    : 'hover:bg-white/5 text-gray-300 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                  </div>
                  <div>
                    <div className="font-medium flex items-center gap-1.5 text-purple-200">
                      <span>Creative Studio</span>
                      <span className="text-[9px] bg-purple-500/30 text-purple-200 px-1 py-0.2 rounded font-normal">
                        DeepAI
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400">Tạo Ảnh, Video, Âm nhạc</div>
                  </div>
                </div>
                {isCreativeMode && <Check className="w-3.5 h-3.5 text-purple-400" />}
              </div>
            </div>
          )}
        </div>

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          id="prompt-textarea"
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={getPlaceholder()}
          className="bg-transparent flex-1 outline-none text-white placeholder:text-gray-400/80 text-sm resize-none max-h-32 min-h-[36px] py-1.5 px-2 leading-normal font-normal"
        />

        {/* Right Tools (Attachment, Mic, Send) */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,.txt,.pdf,.doc,.docx"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-white/10"
            title="Đính kèm tệp"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={toggleSpeechRecognition}
            className={`p-2 transition-colors cursor-pointer rounded-full hover:bg-white/10 ${
              isRecording ? 'text-rose-400 animate-pulse' : 'text-gray-400 hover:text-white'
            }`}
            title={isRecording ? 'Đang lắng nghe...' : 'Nhập bằng giọng nói'}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {isLoading ? (
            <button
              type="button"
              id="stop-generating-btn"
              onClick={onStop}
              className="w-8 h-8 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm"
              title="Dừng phản hồi"
            >
              <Square className="w-3.5 h-3.5 fill-rose-300" />
            </button>
          ) : (
            <button
              type="submit"
              id="send-message-btn"
              disabled={!input.trim() && !selectedAttachment}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
                input.trim() || selectedAttachment
                  ? isCreativeMode
                    ? 'liquid-glass-active-purple text-white hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/30'
                    : 'bg-white text-black hover:bg-gray-200 hover:scale-105 active:scale-95 shadow-md'
                  : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
              }`}
              title="Gửi câu hỏi"
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
