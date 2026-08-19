import React, { useRef, useEffect, useState } from 'react';
import { 
  ArrowUp, 
  Square, 
  Mic, 
  MicOff, 
  Paperclip, 
  Image as ImageIcon,
  Sparkles,
  Zap,
  X,
  ChevronDown,
  Info,
  Check
} from 'lucide-react';

interface PromptInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onStop: () => void;
  isLoading: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  input,
  setInput,
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
  const [showNotice, setShowNotice] = useState<string | null>(null);

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

  // Speech to text integration via Web Speech Recognition
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

  const handleSelectUltra = () => {
    setIsModeOpen(false);
    setShowNotice('Chế độ này chưa có. Nitob Ultra đang được hoàn thiện và sẽ sớm ra mắt!');
    setTimeout(() => {
      setShowNotice(null);
    }, 3500);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-6 relative">
      {/* Toast Notice if Ultra is clicked */}
      {showNotice && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900/95 border border-amber-500/40 text-amber-300 text-xs shadow-2xl backdrop-blur-xl animate-fade-in">
          <Info className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>{showNotice}</span>
          <button 
            onClick={() => setShowNotice(null)} 
            className="ml-1 p-0.5 text-zinc-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Attachment Pill if any */}
      {selectedAttachment && (
        <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md w-fit text-xs text-orange-200 border border-white/10">
          {selectedAttachment.type === 'image' ? (
            <ImageIcon className="w-3.5 h-3.5 text-orange-400" />
          ) : (
            <Paperclip className="w-3.5 h-3.5 text-orange-400" />
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

      {/* Immersive Rounded Input Pill */}
      <form
        onSubmit={(e) => {
          onSubmit(e);
          setSelectedAttachment(null);
        }}
        className="w-full bg-[#181818]/95 border border-white/10 rounded-full px-3.5 py-2 flex items-center gap-2 shadow-2xl backdrop-blur-xl focus-within:border-white/20 transition-all"
      >
        {/* Mode Selector Pill inside Prompt Bar */}
        <div className="relative flex-shrink-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsModeOpen(!isModeOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-xs text-gray-200 font-medium transition-colors cursor-pointer select-none"
            title="Chọn chế độ mô hình"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
            <span>Lite</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          {/* Mode Dropdown Popover */}
          {isModeOpen && (
            <div className="absolute bottom-full left-0 mb-3 w-64 p-2 rounded-2xl bg-[#1c1c1c] border border-white/10 shadow-2xl backdrop-blur-2xl z-50 space-y-1">
              <div className="px-2.5 py-1 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                Chế độ hoạt động
              </div>

              {/* Mode: Lite (Active) */}
              <div
                onClick={() => setIsModeOpen(false)}
                className="flex items-center justify-between p-2 rounded-xl bg-white/10 border border-white/10 text-xs cursor-pointer text-white"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5 fill-amber-400/30" />
                  </div>
                  <div>
                    <div className="font-medium flex items-center gap-1.5">
                      <span>Nitob Lite</span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-normal">
                        Mặc định
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400">Phản hồi nhanh, tinh gọn</div>
                  </div>
                </div>
                <Check className="w-3.5 h-3.5 text-amber-400" />
              </div>

              {/* Mode: Ultra (Unavailable) */}
              <div
                onClick={handleSelectUltra}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 text-xs cursor-pointer text-gray-300 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-medium flex items-center gap-1.5 text-gray-300 group-hover:text-white">
                      <span>Nitob Ultra</span>
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded font-normal">
                        Chưa có
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400">Suy luận sâu, đa tác vụ</div>
                  </div>
                </div>
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
          placeholder="Enter a prompt here..."
          className="bg-transparent flex-1 outline-none text-white placeholder:text-gray-500 text-sm resize-none max-h-32 min-h-[36px] py-1.5 px-2 leading-normal font-normal"
        />

        {/* Right Tools (Attachment, Mic, Send) */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
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
            className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-white/5"
            title="Đính kèm tệp"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={toggleSpeechRecognition}
            className={`p-2 transition-colors cursor-pointer rounded-full hover:bg-white/5 ${
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
              className="w-8 h-8 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-full flex items-center justify-center transition-all cursor-pointer"
              title="Dừng phản hồi"
            >
              <Square className="w-3.5 h-3.5 fill-rose-300" />
            </button>
          ) : (
            <button
              type="submit"
              id="send-message-btn"
              disabled={!input.trim() && !selectedAttachment}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                input.trim() || selectedAttachment
                  ? 'bg-white text-black hover:bg-gray-200 hover:scale-105 active:scale-95 shadow-md'
                  : 'bg-white/10 text-gray-500 cursor-not-allowed'
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

