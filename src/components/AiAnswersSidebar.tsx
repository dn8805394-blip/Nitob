import React from 'react';
import { 
  Bot, 
  ChevronRight, 
  Sparkles, 
  PanelRightClose, 
  Clock,
  ListTree
} from 'lucide-react';
import { Message } from '../types';

interface AiAnswersSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  messages: Message[];
  activeMessageId: string | null;
  onSelectAnswer: (messageId: string) => void;
}

export const AiAnswersSidebar: React.FC<AiAnswersSidebarProps> = ({
  isOpen,
  onToggle,
  messages,
  activeMessageId,
  onSelectAnswer,
}) => {
  // Filter only assistant messages with content
  const aiMessages = messages.filter((m) => m.role === 'assistant');

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden transition-opacity"
        />
      )}

      {/* Floating Right Sidebar Panel */}
      <aside
        id="ai-answers-sidebar"
        className={`fixed top-3.5 bottom-3.5 right-3.5 z-40 flex flex-col transition-all duration-300 ease-in-out rounded-[28px] overflow-hidden ${
          isOpen
            ? 'w-[280px] translate-x-0 opacity-100 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),inset_0_1px_1px_0_rgba(255,255,255,0.14)]'
            : 'w-0 translate-x-full opacity-0 pointer-events-none'
        } bg-[#111216]/85 backdrop-blur-3xl border border-white/[0.08]`}
      >
        <div className="relative z-10 w-[280px] flex flex-col h-full p-3.5">
          {/* Header */}
          <div className="flex items-center justify-between px-2 py-2 mb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-sm">
                <ListTree className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-white tracking-wide">
                  Mục lục câu trả lời
                </span>
                <span className="text-[10px] font-medium bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded-full border border-purple-500/30">
                  {aiMessages.length}
                </span>
              </div>
            </div>

            <button
              onClick={onToggle}
              className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Đóng bảng câu trả lời"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          </div>

          {/* Subtitle description */}
          <p className="px-2 pb-2 text-[11px] text-gray-400 leading-relaxed">
            Nhấn vào bất kỳ câu nào để cuộn nhanh đến câu trả lời tương ứng.
          </p>

          {/* List of AI Answers */}
          <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-2 scrollbar-none">
            {aiMessages.length === 0 ? (
              <div className="px-3 py-10 text-center text-xs text-gray-500 font-light space-y-2">
                <Bot className="w-8 h-8 mx-auto text-gray-600 opacity-60" />
                <p>Chưa có câu trả lời nào từ AI trong phiên này.</p>
              </div>
            ) : (
              aiMessages.map((msg, index) => {
                const isActive = activeMessageId === msg.id;
                // Extract clean first line as snippet preview
                const cleanSnippet = msg.content
                  ? msg.content.replace(/[`*#_\[\]()]/g, '').trim().slice(0, 75)
                  : msg.isStreaming
                  ? 'Đang soạn câu trả lời...'
                  : 'Phản hồi';

                const formattedTime = new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={msg.id}
                    onClick={() => onSelectAnswer(msg.id)}
                    className={`group relative flex flex-col p-2.5 rounded-2xl text-xs transition-all border cursor-pointer select-none ${
                      isActive
                        ? 'bg-purple-500/15 border-purple-500/40 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16)]'
                        : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.05] hover:border-white/[0.12] text-zinc-300 hover:text-white'
                    }`}
                  >
                    {/* Top Row: Index Badge & Time */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-semibold text-purple-300">
                          #{index + 1}
                        </span>
                        <span className="text-[11px] font-medium text-gray-300 flex items-center gap-1">
                          {msg.isStreaming && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                          )}
                          Câu trả lời {index + 1}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{formattedTime}</span>
                      </div>
                    </div>

                    {/* Preview Snippet */}
                    <p className="text-[11px] text-gray-400 group-hover:text-gray-200 line-clamp-2 leading-relaxed">
                      {cleanSnippet || '...'}
                    </p>

                    {/* Hover indicator */}
                    <div className="mt-1.5 flex items-center justify-end text-[10px] text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Cuộn tới</span>
                      <ChevronRight className="w-3 h-3 ml-0.5" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
