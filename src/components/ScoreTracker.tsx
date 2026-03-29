import React, { useState } from 'react';
import { Plus, Minus, Save, UserPlus, AlertCircle } from 'lucide-react';
import { Player, ScoreRecord, GameSession } from '../types';
import { cn } from '../lib/utils';

interface ScoreTrackerProps {
  players: Player[];
  onSaveSession: (session: GameSession) => void;
}

export default function ScoreTracker({ players, onSaveSession }: ScoreTrackerProps) {
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  
  const getLocalDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState(getLocalDate());

  const togglePlayer = (id: string) => {
    if (selectedPlayerIds.includes(id)) {
      setSelectedPlayerIds(selectedPlayerIds.filter((pid) => pid !== id));
      const newScores = { ...scores };
      delete newScores[id];
      setScores(newScores);
    } else if (selectedPlayerIds.length < 4) {
      setSelectedPlayerIds([...selectedPlayerIds, id]);
      setScores({ ...scores, [id]: 0 });
    }
  };

  const handleScoreChange = (id: string, value: string) => {
    const num = parseInt(value) || 0;
    setScores({ ...scores, [id]: num });
  };

  const totalSum = Object.values(scores).reduce((sum, s) => sum + s, 0);
  const isValid = selectedPlayerIds.length === 4 && totalSum === 0;

  const handleSave = () => {
    if (!isValid) return;

    const records: ScoreRecord[] = selectedPlayerIds.map((id) => ({
      playerId: id,
      score: scores[id],
    }));

    onSaveSession({
      id: crypto.randomUUID(),
      timestamp: new Date(date + 'T00:00:00').getTime(),
      records,
      notes,
    });

    // Reset
    setSelectedPlayerIds([]);
    setScores({});
    setNotes('');
    setDate(getLocalDate());
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Player Selection */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xl font-serif font-semibold flex items-center gap-2">
            <UserPlus size={20} className="text-olive" />
            选择参与玩家 ({selectedPlayerIds.length}/4)
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {players.map((player) => (
              <button
                key={player.id}
                onClick={() => togglePlayer(player.id)}
                className={cn(
                  "p-3 rounded-2xl border text-left transition-all flex items-center gap-3",
                  selectedPlayerIds.includes(player.id)
                    ? "bg-olive text-white border-olive shadow-md"
                    : "bg-white border-black/5 hover:border-olive/30"
                )}
              >
                <img
                  src={player.avatarUrl}
                  alt={player.nickname}
                  className="w-8 h-8 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="font-medium truncate">{player.nickname}</span>
              </button>
            ))}
          </div>
          {players.length < 4 && (
            <p className="text-xs text-red-500 italic">
              提示：您需要至少添加 4 名玩家才能开始计分。
            </p>
          )}
        </div>

        {/* Score Input */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-serif font-semibold">输入输赢金额</h3>
          
          <div className="space-y-4">
            {selectedPlayerIds.length === 0 ? (
              <div className="h-48 flex items-center justify-center border-2 border-dashed border-black/5 rounded-[32px] text-ink/30 italic">
                请先在左侧选择 4 位玩家
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedPlayerIds.map((id) => {
                  const player = players.find((p) => p.id === id);
                  return (
                    <div key={id} className="card p-4 flex items-center gap-4">
                      <img
                        src={player?.avatarUrl}
                        alt={player?.nickname}
                        className="w-12 h-12 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-ink/60 mb-1">{player?.nickname}</p>
                        <div className="relative">
                          <input
                            type="number"
                            value={scores[id] || ''}
                            onChange={(e) => handleScoreChange(id, e.target.value)}
                            className={cn(
                              "w-full bg-paper border-none rounded-xl px-4 py-2 text-xl font-bold focus:ring-2 focus:ring-olive/20",
                              scores[id] > 0 ? "text-green-600" : scores[id] < 0 ? "text-red-600" : "text-ink"
                            )}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selectedPlayerIds.length === 4 && (
            <div className="space-y-4">
              <div className={cn(
                "p-4 rounded-2xl flex items-center justify-between",
                totalSum === 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              )}>
                <div className="flex items-center gap-2">
                  <AlertCircle size={18} />
                  <span className="font-medium">
                    {totalSum === 0 ? "金额已平账" : `金额未平账：当前总计 ${totalSum > 0 ? '+' : ''}${totalSum}`}
                  </span>
                </div>
                <div className="text-sm opacity-80">
                  {totalSum === 0 ? "可以保存对局记录" : "请检查各玩家金额，确保总和为 0"}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-ink/60">对局日期</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-field w-full"
                />
              </div>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="添加备注（如：地点、特殊规则等）..."
                className="input-field w-full h-24 resize-none"
              />

              <button
                onClick={handleSave}
                disabled={!isValid}
                className={cn(
                  "w-full py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-all",
                  isValid ? "bg-olive text-white shadow-lg shadow-olive/20" : "bg-black/5 text-ink/20 cursor-not-allowed"
                )}
              >
                <Save size={20} />
                保存对局记录
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
