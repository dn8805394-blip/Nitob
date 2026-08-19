import React, { useState } from 'react';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Settings, 
  PanelLeftClose, 
  Check,
  Edit2,
  Clock
} from 'lucide-react';
import { Conversation } from '../types';
import { NitobLogo } from './NitobLogo';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onOpenSettings: () => void;
  onReplayIntro: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onOpenSettings,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile Glass Backdrop */}
      {isOpen && (
        <div 
          onClick={onToggle}
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-30 md:hidden transition-opacity"
        />
      )}

      {/* Floating Rounded Liquid Glass Sidebar */}
      <aside
        id="nitob-sidebar"
        className={`fixed top-3.5 bottom-3.5 left-3.5 z-40 flex flex-col transition-all duration-300 ease-in-out rounded-[28px] overflow-hidden ${
          isOpen 
            ? 'w-[276px] translate-x-0 opacity-100 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),inset_0_1px_1px_0_rgba(255,255,255,0.14)]' 
            : 'w-0 -translate-x-full opacity-0 pointer-events-none'
        } bg-[#111216]/55 backdrop-blur-3xl backdrop-saturate-150 border border-white/[0.07]`}
      >
        {/* Subtle Liquid Glass Specular Gradient Sheen */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.01) 60%, transparent 100%)',
          }}
        />

        <div className="relative z-10 w-[276px] flex flex-col h-full p-3.5">
          {/* Header & Brand */}
          <div className="flex items-center justify-between px-1.5 py-1.5 mb-3">
            <div className="flex items-center gap-2.5">
              <NitobLogo className="w-7 h-7 shadow-sm" />
              <div className="flex items-center gap-1.5">
                <span className="text-base font-medium tracking-tight text-white font-['Outfit']">
                  Nitob
                </span>
                <span className="text-[10px] font-normal bg-white/10 text-gray-300 px-2 py-0.5 rounded-full border border-white/5">
                  Lite
                </span>
              </div>
            </div>

            <button
              id="sidebar-toggle-close-btn"
              onClick={onToggle}
              className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Thu gọn thanh bên"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* New Chat Button - Liquid Glass Pill */}
          <button
            id="new-chat-btn"
            onClick={onNewChat}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] hover:border-white/[0.18] text-gray-200 hover:text-white font-medium text-xs md:text-sm transition-all duration-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] cursor-pointer mb-3.5 group backdrop-blur-md"
          >
            <Plus className="w-4 h-4 text-gray-300 group-hover:rotate-90 transition-transform duration-300" />
            <span>Cuộc trò chuyện mới</span>
          </button>

          {/* Chat History Section */}
          <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-1 scrollbar-none">
            <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium tracking-wider text-gray-400 uppercase">
              <Clock className="w-3 h-3" />
              <span>Gần đây</span>
            </div>

            {conversations.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-gray-500 font-light">
                Chưa có lịch sử trò chuyện
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = conv.id === activeId;
                const isEditing = editingId === conv.id;

                return (
                  <div
                    key={conv.id}
                    onClick={() => onSelectConversation(conv.id)}
                    className={`group relative flex items-center justify-between px-3 py-2 rounded-2xl text-xs transition-all border cursor-pointer select-none ${
                      isActive 
                        ? 'bg-white/[0.12] text-white font-medium border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16)] backdrop-blur-md' 
                        : 'text-zinc-300 hover:bg-white/[0.05] hover:text-white border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate flex-1 mr-1">
                      <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                      {isEditing ? (
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(conv.id, e);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          className="bg-black/60 border border-white/30 rounded-lg px-1.5 py-0.5 text-xs text-white outline-none w-full"
                        />
                      ) : (
                        <span className="truncate">{conv.title || 'Cuộc trò chuyện mới'}</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isEditing ? (
                        <button
                          onClick={(e) => handleSaveRename(conv.id, e)}
                          className="p-1 hover:text-emerald-400 text-gray-400"
                          title="Lưu"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={(e) => handleStartRename(conv, e)}
                            className="p-1 hover:text-white text-gray-400"
                            title="Đổi tên"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteConversation(conv.id);
                            }}
                            className="p-1 hover:text-rose-400 text-gray-400"
                            title="Xóa"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Utility Menu - Floating Glass Pill */}
          <div className="pt-2.5 mt-auto border-t border-white/[0.06] space-y-1">
            <button
              id="open-settings-btn"
              onClick={onOpenSettings}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-2xl text-xs text-gray-300 hover:text-white bg-white/[0.02] hover:bg-white/[0.07] border border-white/[0.04] hover:border-white/[0.1] transition-all cursor-pointer shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
            >
              <Settings className="w-4 h-4 text-gray-400" />
              <span>Cài đặt & Tùy chọn</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
