import React, { useState, useEffect, useRef } from 'react';
import { 
  PanelLeft, 
  Plus, 
  Settings,
  Cpu,
  ListTree,
  Sparkles
} from 'lucide-react';
import { Conversation, Message, AppMode, CreativeMediaType, CreativeMediaAttachment } from './types';
import { AnimatedBackground } from './components/AnimatedBackground';
import { HalloweenCurtainIntro } from './components/HalloweenCurtainIntro';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { PromptInput } from './components/PromptInput';
import { SettingsModal } from './components/SettingsModal';
import { AiAnswersSidebar } from './components/AiAnswersSidebar';
import { NitobLogo } from './components/NitobLogo';
import { sendChatMessage, checkGeminiNanoAvailable } from './services/aiService';

const STORAGE_KEY = 'nitob_conversations_v1';

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiAnswersOpen, setAiAnswersOpen] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [isOnDeviceAvailable, setIsOnDeviceAvailable] = useState(false);

  // App & Creative Studio Mode
  const [mode, setMode] = useState<AppMode>('standard');
  const [activeCreativeType, setActiveCreativeType] = useState<CreativeMediaType>('image');

  const abortControllerRef = useRef<AbortController | null>(null);

  // Check On-Device Gemini Nano support in background
  useEffect(() => {
    checkGeminiNanoAvailable().then((res) => {
      setIsOnDeviceAvailable(res.available);
    });
  }, []);

  // Save conversations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch {}
  }, [conversations]);

  // Get active conversation messages
  const activeConversation = conversations.find((c) => c.id === activeId);
  const messages = activeConversation?.messages || [];
  const aiMessagesCount = messages.filter((m) => m.role === 'assistant').length;

  // Create new conversation
  const handleNewChat = () => {
    if (isLoading) {
      handleStopGenerating();
    }
    const newId = Date.now().toString();
    const newConv: Conversation = {
      id: newId,
      title: mode === 'creative' ? 'Sáng tạo Creative mới' : 'Cuộc trò chuyện mới',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      mode,
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newId);
    setInput('');
  };

  // Delete conversation
  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      setActiveId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Rename conversation
  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
  };

  // Clear all chats
  const handleClearAllChats = () => {
    setConversations([]);
    setActiveId(null);
  };

  // Stop active streaming request
  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  };

  // Scroll directly to selected AI answer & highlight
  const handleSelectAnswer = (messageId: string) => {
    setHighlightedMessageId(messageId);
    const targetElement = document.getElementById(`msg-${messageId}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(() => {
      setHighlightedMessageId(null);
    }, 2500);
  };

  // Handle message sending (Standard Chat vs Creative Studio)
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend || isLoading) return;

    let targetConvId = activeId;
    let currentConv = conversations.find((c) => c.id === targetConvId);

    // If no active conversation, create one
    if (!targetConvId || !currentConv) {
      const newId = Date.now().toString();
      const prefix = mode === 'creative' ? `[${activeCreativeType.toUpperCase()}] ` : '';
      const generatedTitle = prefix + textToSend.slice(0, 26) + (textToSend.length > 26 ? '...' : '');
      const newConv: Conversation = {
        id: newId,
        title: generatedTitle,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        mode,
      };
      targetConvId = newId;
      currentConv = newConv;
      setConversations((prev) => [newConv, ...prev]);
      setActiveId(newId);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };

    const aiMessageId = (Date.now() + 1).toString();
    const initialAiMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    // Update conversation with user message & pending AI message
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === targetConvId) {
          const updatedMessages = [...c.messages, userMessage, initialAiMessage];
          return {
            ...c,
            title: c.messages.length === 0 ? textToSend.slice(0, 30) + (textToSend.length > 30 ? '...' : '') : c.title,
            messages: updatedMessages,
            updatedAt: Date.now(),
          };
        }
        return c;
      })
    );

    setInput('');
    setIsLoading(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // === CREATIVE STUDIO EXECUTION (Image / Video / Music) ===
    if (mode === 'creative') {
      try {
        const endpoint = `/api/creative/${activeCreativeType}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: textToSend }),
          signal: abortController.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Lỗi khi tạo tác phẩm ${activeCreativeType}`);
        }

        const mediaAttachment: CreativeMediaAttachment = {
          type: activeCreativeType,
          status: 'ready',
          prompt: textToSend,
          url: data.url,
          title: data.title,
          thumbnailUrl: data.thumbnailUrl,
          audioData: data.audioData,
          provider: data.provider,
        };

        const resultSummary = 
          activeCreativeType === 'image'
            ? `🎨 **Tác phẩm DeepAI đã hoàn thành!**\n*Mô tả:* "${textToSend}"`
            : activeCreativeType === 'video'
            ? `🎬 **Phim ngắn AI đã được kết xuất!**\n*Kịch bản:* "${textToSend}"`
            : `🎵 **Bản hòa âm sáng tạo đã được soạn xong!**\n*Phong cách:* ${data.audioData?.genre || 'Ambient'}`;

        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === targetConvId) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === aiMessageId
                    ? {
                        ...m,
                        isStreaming: false,
                        content: resultSummary,
                        media: mediaAttachment,
                      }
                    : m
                ),
              };
            }
            return c;
          })
        );
      } catch (err: unknown) {
        if ((err as Error)?.name !== 'AbortError') {
          const errMsg = (err as Error)?.message || 'Không thể khởi tạo tác phẩm lúc này.';
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === targetConvId) {
                return {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === aiMessageId
                      ? {
                          ...m,
                          isStreaming: false,
                          content: `⚠️ **Thông báo Creative:** ${errMsg}`,
                          error: true,
                        }
                      : m
                  ),
                };
              }
              return c;
            })
          );
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
      return;
    }

    // === STANDARD HYBRID AI CHAT EXECUTION ===
    const conversationHistory = [...(currentConv?.messages || []), userMessage];

    let fullReceivedText = '';
    let displayedText = '';
    let isStreamDone = false;
    let isAborted = false;

    abortController.signal.addEventListener('abort', () => {
      isAborted = true;
    });

    try {
      const pacingPromise = (async () => {
        while (!isAborted) {
          if (displayedText.length < fullReceivedText.length) {
            const remaining = fullReceivedText.length - displayedText.length;
            const step = remaining > 160 ? 10 : remaining > 70 ? 5 : remaining > 30 ? 3 : 2;
            displayedText = fullReceivedText.slice(0, displayedText.length + step);

            setConversations((prev) =>
              prev.map((c) => {
                if (c.id === targetConvId) {
                  return {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === aiMessageId
                        ? { ...m, content: displayedText, isStreaming: true }
                        : m
                    ),
                  };
                }
                return c;
              })
            );
            await new Promise((r) => setTimeout(r, 20));
          } else if (isStreamDone) {
            break;
          } else {
            await new Promise((r) => setTimeout(r, 30));
          }
        }
      })();

      await sendChatMessage(
        conversationHistory.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        {
          onChunk: (chunk) => {
            fullReceivedText += chunk;
          },
          onError: (errMsg) => {
            fullReceivedText += `\n\n*(Thông báo: ${errMsg})*`;
          },
          onDone: () => {
            isStreamDone = true;
          },
        },
        abortController.signal
      );

      isStreamDone = true;
      await pacingPromise;

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === targetConvId) {
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === aiMessageId
                  ? {
                      ...m,
                      isStreaming: false,
                      content: fullReceivedText || displayedText || 'Xin lỗi, không có phản hồi.',
                    }
                  : m
              ),
            };
          }
          return c;
        })
      );
    } catch (err: unknown) {
      if ((err as Error)?.name !== 'AbortError') {
        const errorText = (err as Error)?.message || 'Đã có lỗi xảy ra khi xử lý yêu cầu.';
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === targetConvId) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === aiMessageId
                    ? {
                        ...m,
                        isStreaming: false,
                        content: `**Thông báo:** ${errorText}\n\n*Gợi ý: Bạn có thể bật Gemini Nano trong \`chrome://flags\` để dùng On-Device không cần API Key, hoặc cấu hình \`GEMINI_API_KEY\` trên Vercel.*`,
                        error: true,
                      }
                    : m
                ),
              };
            }
            return c;
          })
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleRetryLast = () => {
    if (messages.length >= 2) {
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
      if (lastUserMsg) {
        handleSendMessage(lastUserMsg.content);
      }
    }
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden text-[#e3e3e3] bg-[#0d0d0d] select-text">
      {/* Clean Ambient Dark Background */}
      <AnimatedBackground />

      {/* Halloween Curtain Intro on first visit or replay */}
      {showIntro && (
        <HalloweenCurtainIntro
          onComplete={() => {
            setShowIntro(false);
          }}
        />
      )}

      {/* Collapsible Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={(id) => setActiveId(id)}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Main Workspace */}
      <main
        className={`relative flex flex-col flex-1 h-full min-w-0 transition-all duration-300 ${
          sidebarOpen ? 'md:pl-[300px]' : 'pl-0'
        } ${aiAnswersOpen ? 'xl:pr-[300px]' : 'pr-0'}`}
      >
        {/* Top Header */}
        <header className="relative z-10 flex items-center justify-between px-6 py-4.5 w-full">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                id="open-sidebar-btn"
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Mở thanh bên"
              >
                <PanelLeft className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center gap-2.5">
              <NitobLogo className="w-7 h-7" />
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-medium tracking-tight text-white font-['Outfit']">
                  Nitob
                </h1>
                <span className={`text-[10px] font-normal px-2 py-0.5 rounded-full border ${
                  mode === 'creative' 
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30 font-medium'
                    : 'bg-white/10 text-gray-300 border-white/5'
                }`}>
                  {mode === 'creative' ? 'Creative Studio' : 'Lite'}
                </span>
                {isOnDeviceAvailable && mode === 'standard' && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <Cpu className="w-2.5 h-2.5" /> On-Device (No API Key)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            {/* Quick Creative Mode Switcher */}
            <button
              onClick={() => setMode(mode === 'creative' ? 'standard' : 'creative')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                mode === 'creative'
                  ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 border-purple-500/50 text-purple-200 shadow-md shadow-purple-500/20'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300 hover:text-white'
              }`}
              title="Chuyển chế độ Creative / Lite"
            >
              <Sparkles className={`w-3.5 h-3.5 ${mode === 'creative' ? 'text-purple-300 animate-spin' : 'text-gray-400'}`} style={{ animationDuration: '8s' }} />
              <span className="hidden sm:inline">{mode === 'creative' ? 'Đang bật Creative' : 'Bật Creative'}</span>
            </button>

            {/* AI Answers Navigation Toggle Button */}
            {aiMessagesCount > 0 && (
              <button
                id="header-answers-btn"
                onClick={() => setAiAnswersOpen(!aiAnswersOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                  aiAnswersOpen
                    ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300 hover:text-white'
                }`}
                title="Mở danh sách câu trả lời của AI"
              >
                <ListTree className="w-4 h-4 text-purple-400" />
                <span className="hidden sm:inline">Mục lục câu trả lời</span>
                <span className="w-4 h-4 rounded-full bg-purple-500/30 text-purple-200 flex items-center justify-center text-[10px]">
                  {aiMessagesCount}
                </span>
              </button>
            )}

            {/* Quick New Chat Button */}
            <button
              id="header-new-chat-btn"
              onClick={handleNewChat}
              className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer border border-white/10"
              title="Cuộc trò chuyện mới"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Settings Button */}
            <button
              id="header-settings-btn"
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer border border-white/10"
              title="Cài đặt"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Center Chat Viewport */}
        <ChatArea
          messages={messages}
          isLoading={isLoading}
          highlightedMessageId={highlightedMessageId}
          onSelectSuggestion={(prompt) => handleSendMessage(prompt)}
          onRetryLast={handleRetryLast}
        />

        {/* Floating Input with Mode & Creative Tools */}
        <PromptInput
          input={input}
          setInput={setInput}
          mode={mode}
          setMode={setMode}
          activeCreativeType={activeCreativeType}
          setActiveCreativeType={setActiveCreativeType}
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          onStop={handleStopGenerating}
          isLoading={isLoading}
        />
      </main>

      {/* Right AI Answers Quick Jump Sidebar */}
      <AiAnswersSidebar
        isOpen={aiAnswersOpen}
        onToggle={() => setAiAnswersOpen(!aiAnswersOpen)}
        messages={messages}
        activeMessageId={highlightedMessageId}
        onSelectAnswer={handleSelectAnswer}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onClearAllChats={handleClearAllChats}
        onReplayIntro={() => setShowIntro(true)}
      />
    </div>
  );
}
