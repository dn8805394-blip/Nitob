import React from 'react';
import { X, Shield, Trash2, Sliders } from 'lucide-react';
import { HalloweenConfig } from '../types';
import { NitobLogo } from './NitobLogo';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  halloweenConfig: HalloweenConfig;
  setHalloweenConfig: React.Dispatch<React.SetStateAction<HalloweenConfig>>;
  onClearAllChats: () => void;
  onReplayIntro: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  halloweenConfig,
  setHalloweenConfig,
  onClearAllChats,
  onReplayIntro,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-2xl bg-[#141414] border border-white/10 p-6 shadow-2xl backdrop-blur-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-2.5">
            <NitobLogo className="w-6 h-6" />
            <h2 className="text-base font-medium text-white font-['Outfit']">
              Cài đặt & Tùy chọn
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options List */}
        <div className="space-y-3.5 text-sm">
          {/* Festive Leaves Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-3">
              <span className="text-lg">🍂</span>
              <div>
                <div className="font-medium text-gray-200 text-xs md:text-sm">Hiệu ứng lá vàng rơi</div>
                <div className="text-[11px] text-gray-400">Không khí nhẹ nhàng mùa thu</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={halloweenConfig.leavesEnabled}
                onChange={(e) =>
                  setHalloweenConfig((prev) => ({ ...prev, leavesEnabled: e.target.checked }))
                }
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>

          {/* Replay Theater Intro */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-3">
              <span className="text-lg">🎃</span>
              <div>
                <div className="font-medium text-gray-200 text-xs md:text-sm">Mở lại rèm lễ hội</div>
                <div className="text-[11px] text-gray-400">Xem lại hiệu ứng kéo rèm</div>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onReplayIntro();
              }}
              className="px-3 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-xs font-medium transition-colors cursor-pointer border border-orange-500/30"
            >
              Mở lại
            </button>
          </div>

          {/* Security & Privacy */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
            <div className="flex items-center gap-2 text-green-400 font-medium text-xs">
              <Shield className="w-3.5 h-3.5" />
              <span>Nano Core Security & Privacy</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Dữ liệu được xử lý độc lập qua máy chủ API bảo mật phía backend. Khóa API không bao giờ được gửi về trình duyệt của người dùng.
            </p>
          </div>

          {/* Clear History */}
          <div className="pt-1">
            <button
              onClick={() => {
                if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện?')) {
                  onClearAllChats();
                  onClose();
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 font-medium text-xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa toàn bộ lịch sử trò chuyện</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
