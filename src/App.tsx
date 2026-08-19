import React, { useState, useEffect, useRef } from 'react';
import { 
  PanelLeft, 
  Plus, 
  Settings
} from 'lucide-react';
import { Conversation, Message } from './types';
import { AnimatedBackground } from './components/AnimatedBackground';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { PromptInput } from './components/PromptInput';
import { SettingsModal } from './components/SettingsModal';
import { NitobLogo } from './components/NitobLogo';

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
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Save conversations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch {}
  }, [conversations]);

  // Get active conversation messages
  const activeConversation = conversations.find((c) => c.id === activeId);
  const messages = activeConversation?.messages || [];

  // Create new conversation
  const handleNewChat = () => {
    if (isLoading) {
      handleStopGenerating();
    }
    const newId = Date.now().toString();
    const newConv: Conversation = {
      id: newId,
      title: 'Cuộc trò chuyện mới',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
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

  // Send message to Nitob AI backend
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend || isLoading) return;

    let targetConvId = activeId;
    let currentConv = conversations.find((c) => c.id === targetConvId);

    // If no active conversation, create one
    if (!targetConvId || !currentConv) {
      const newId = Date.now().toString();
      const generatedTitle = textToSend.slice(0, 30) + (textToSend.length > 30 ? '...' : '');
      const newConv: Conversation = {
        id: newId,
        title: generatedTitle,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
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

    const conversationHistory = [...(currentConv?.messages || []), userMessage];

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: conversationHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          stream: true,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Máy chủ phản hồi với mã lỗi ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Không thể đọc dữ liệu từ máy chủ.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullReceivedText = '';
      let displayedText = '';
      let isNetworkDone = false;
      let isAborted = false;

      // Listen for abort
      abortController.signal.addEventListener('abort', () => {
        isAborted = true;
      });

      // Background network chunk collector
      const networkReaderPromise = (async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) {
              isNetworkDone = true;
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.replace('data: ', '').trim();
                if (dataStr === '[DONE]') {
                  isNetworkDone = true;
                  break;
                }
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.error) {
                    let cleanErr = parsed.error;
                    if (typeof cleanErr === 'string') {
                      try {
                        const innerJson = JSON.parse(cleanErr);
                        cleanErr = innerJson.error?.message || innerJson.message || cleanErr;
                      } catch {}
                    }
                    if (cleanErr.includes('503') || cleanErr.includes('high demand') || cleanErr.includes('UNAVAILABLE')) {
                      cleanErr = 'Máy chủ AI hiện đang tiếp nhận lượng truy cập cao. Nitob đang tự động chuyển kênh xử lý, vui lòng thử lại sau giây lát.';
                    }
                    fullReceivedText += `\n\n*(Thông báo: ${cleanErr})*`;
                  } else if (parsed.text) {
                    fullReceivedText += parsed.text;
                  }
                } catch {
                  // ignore non-json
                }
              }
            }
          }
        } catch (readErr) {
          if (!isAborted) {
            console.error('Error reading stream:', readErr);
          }
        } finally {
          isNetworkDone = true;
        }
      })();

      // Smooth Typing Playback Loop (cadence pacing)
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
        } else if (isNetworkDone) {
          break;
        } else {
          await new Promise((r) => setTimeout(r, 30));
        }
      }

      await networkReaderPromise;

      // Finalize streaming
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
      if ((err as Error)?.name === 'AbortError') {
        console.log('User stopped generation');
      } else {
        console.error('Lỗi khi gửi tin nhắn:', err);
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
                        content: `**Đã xảy ra lỗi kết nối:** ${errorText}\n\n*Vui lòng thử lại sau vài giây.*`,
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
        }`}
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
              <h1 className="text-lg font-medium tracking-tight text-white font-['Outfit'] flex items-center">
                Nitob 
                <span className="text-[11px] font-normal bg-white/10 text-gray-300 px-2 py-0.5 rounded-full ml-2">
                  Lite
                </span>
              </h1>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
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
          onSelectSuggestion={(prompt) => handleSendMessage(prompt)}
          onRetryLast={handleRetryLast}
        />

        {/* Floating Input */}
        <PromptInput
          input={input}
          setInput={setInput}
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          onStop={handleStopGenerating}
          isLoading={isLoading}
        />
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onClearAllChats={handleClearAllChats}
      />
    </div>
  );
}
