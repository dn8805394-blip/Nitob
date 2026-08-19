import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  ThumbsUp, 
  ThumbsDown,
  Sparkles
} from 'lucide-react';
import { Message } from '../types';
import { NitobLogo } from './NitobLogo';
import { CreativeMediaCard } from './CreativeMediaCard';

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  highlightedMessageId?: string | null;
  onSelectSuggestion?: (prompt: string) => void;
  onRetryLast: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isLoading,
  highlightedMessageId,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [likedMap, setLikedMap] = useState<Record<string, boolean | null>>({});

  // Track previous streaming state of assistant messages to detect completion
  const prevStreamingStateRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    // Check if any message is actively streaming
    const activeStreamingMsg = messages.find((m) => m.role === 'assistant' && m.isStreaming);
    
    // Check if an AI message just finished streaming
    let justFinishedId: string | null = null;
    messages.forEach((m) => {
      if (m.role === 'assistant') {
        const wasStreaming = prevStreamingStateRef.current[m.id];
        if (wasStreaming && !m.isStreaming) {
          justFinishedId = m.id;
        }
        prevStreamingStateRef.current[m.id] = !!m.isStreaming;
      }
    });

    if (activeStreamingMsg || isLoading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (justFinishedId) {
      const timer = setTimeout(() => {
        const targetElement = document.getElementById(`msg-${justFinishedId}`);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      if (messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.role === 'user') {
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  }, [messages, isLoading]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Trình duyệt của bạn chưa hỗ trợ chức năng đọc văn bản.');
      return;
    }

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[`*#_\[\]()]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'vi-VN';
    utterance.rate = 1.0;

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleFeedback = (id: string, isLike: boolean) => {
    setLikedMap((prev) => ({
      ...prev,
      [id]: prev[id] === isLike ? null : isLike,
    }));
  };

  return (
    <div 
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto px-4 md:px-8 py-6 w-full max-w-3xl mx-auto flex flex-col scroll-smooth"
    >
      {/* Empty State: Immersive Welcome Screen with Animated Dynamic RGB Text */}
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center items-center text-center my-auto">
          <div className="max-w-xl mx-auto space-y-4">
            {/* Dynamic RGB Gradient Heading */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight font-['Outfit'] animate-rgb-text animate-rgb-glow drop-shadow-lg pb-1">
              Hello, I am Nitob.
            </h2>
            <p className="text-gray-300 text-base md:text-lg font-normal leading-relaxed">
              Trợ lý trí tuệ nhân tạo thông minh, đầy đủ và bảo mật tuyệt đối.
            </p>
          </div>
        </div>
      ) : (
        /* Conversation Message Stream */
        <div className="space-y-6 pb-6">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isHighlighted = highlightedMessageId === msg.id;

            return (
              <div
                key={msg.id}
                id={`msg-${msg.id}`}
                className={`flex gap-3 md:gap-4 scroll-mt-20 transition-all duration-300 ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {/* AI Avatar */}
                {!isUser && (
                  <NitobLogo className="w-7 h-7 flex-shrink-0 mt-0.5 rounded-lg shadow-sm" />
                )}

                {/* Message Bubble */}
                <div className={`max-w-[88%] md:max-w-[82%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-2xl px-5 py-3.5 text-sm md:text-[15px] leading-relaxed transition-all ${
                      isUser
                        ? 'bg-white/10 border border-white/10 text-white font-normal backdrop-blur-md rounded-tr-sm'
                        : `bg-[#151515]/90 border backdrop-blur-xl text-gray-200 rounded-tl-sm shadow-md w-full ${
                            isHighlighted
                              ? 'border-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.5)] ring-2 ring-purple-400/80 highlight-ai-message'
                              : 'border-white/10'
                          }`
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="markdown-content">
                        {msg.content ? (
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        ) : msg.isStreaming ? (
                          <div className="flex items-center gap-2 text-gray-400 py-1">
                            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                            <span className="text-xs">Nitob đang xử lý yêu cầu sáng tạo...</span>
                          </div>
                        ) : null}

                        {/* Render DeepAI / Creative Media Card if attached */}
                        {msg.media && (
                          <CreativeMediaCard media={msg.media} />
                        )}
                      </div>
                    )}
                  </div>

                  {/* AI Response Toolbar */}
                  {!isUser && msg.content && (
                    <div className="flex items-center gap-1 mt-2 px-1 text-gray-500 text-xs">
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="p-1.5 rounded-lg hover:text-gray-200 hover:bg-white/10 transition-colors"
                        title="Sao chép nội dung"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => handleSpeak(msg.id, msg.content)}
                        className={`p-1.5 rounded-lg hover:text-gray-200 hover:bg-white/10 transition-colors ${
                          speakingId === msg.id ? 'text-amber-400' : ''
                        }`}
                        title="Đọc văn bản"
                      >
                        {speakingId === msg.id ? (
                          <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => handleFeedback(msg.id, true)}
                        className={`p-1.5 rounded-lg hover:text-gray-200 hover:bg-white/10 transition-colors ${
                          likedMap[msg.id] === true ? 'text-amber-400' : ''
                        }`}
                        title="Hữu ích"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleFeedback(msg.id, false)}
                        className={`p-1.5 rounded-lg hover:text-gray-200 hover:bg-white/10 transition-colors ${
                          likedMap[msg.id] === false ? 'text-rose-400' : ''
                        }`}
                        title="Chưa hài lòng"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};
