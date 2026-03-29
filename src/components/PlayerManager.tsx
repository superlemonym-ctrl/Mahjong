import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, User, Camera, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Player } from '../types';
import { cn } from '../lib/utils';

interface PlayerManagerProps {
  players: Player[];
  onAddPlayer: (player: Player) => void;
  onUpdatePlayer: (player: Player) => void;
  onDeletePlayer: (id: string) => void;
}

export default function PlayerManager({
  players,
  onAddPlayer,
  onUpdatePlayer,
  onDeletePlayer,
}: PlayerManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [error, setError] = useState('');

  const resetForm = () => {
    setNickname('');
    setAvatarUrl('');
    setIsAdding(false);
    setEditingId(null);
    setError('');
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        setError('图片大小不能超过 1MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('昵称不能为空');
      return;
    }

    if (editingId) {
      onUpdatePlayer({
        id: editingId,
        nickname,
        avatarUrl: avatarUrl || `https://picsum.photos/seed/${nickname}/200`,
        createdAt: players.find((p) => p.id === editingId)?.createdAt || Date.now(),
      });
    } else {
      onAddPlayer({
        id: crypto.randomUUID(),
        nickname,
        avatarUrl: avatarUrl || `https://picsum.photos/seed/${nickname}/200`,
        createdAt: Date.now(),
      });
    }
    resetForm();
  };

  const startEdit = (player: Player) => {
    setEditingId(player.id);
    setNickname(player.nickname);
    setAvatarUrl(player.avatarUrl);
    setIsAdding(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif font-semibold">玩家管理</h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="btn-olive flex items-center gap-2"
          >
            <Plus size={18} />
            添加玩家
          </button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card p-6"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-paper overflow-hidden flex items-center justify-center border-2 border-dashed border-olive/30 group-hover:border-olive/60 transition-colors">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User size={40} className="text-olive/40" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-2 bg-olive text-white rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform">
                    <Camera size={14} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-ink/60 uppercase tracking-wider">
                    玩家昵称
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="输入昵称..."
                    className="input-field w-full text-lg"
                    autoFocus
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 rounded-full border border-black/10 hover:bg-black/5 transition-colors"
                >
                  取消
                </button>
                <button type="submit" className="btn-olive">
                  {editingId ? '保存修改' : '确认添加'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {players.map((player) => (
            <motion.div
              key={player.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="card p-4 flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <img
                  src={player.avatarUrl}
                  alt={player.nickname}
                  className="w-12 h-12 rounded-full object-cover border-2 border-olive/10"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="font-serif font-semibold text-lg">{player.nickname}</h3>
                  <p className="text-xs text-ink/40">加入于 {new Date(player.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEdit(player)}
                  className="p-2 hover:bg-olive/10 rounded-full text-olive transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => onDeletePlayer(player.id)}
                  className="p-2 hover:bg-red-50 rounded-full text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {players.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center text-ink/40 italic">
            暂无玩家，点击右上角添加您的第一位麻友吧。
          </div>
        )}
      </div>
    </div>
  );
}
