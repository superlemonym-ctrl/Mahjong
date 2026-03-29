import React, { useMemo } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, User } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Player, GameSession, PlayerStats } from '../types';
import { cn } from '../lib/utils';

interface StatsDashboardProps {
  players: Player[];
  sessions: GameSession[];
}

export default function StatsDashboard({ players, sessions }: StatsDashboardProps) {
  const playerStats = useMemo(() => {
    const stats: Record<string, PlayerStats> = {};

    players.forEach((p) => {
      stats[p.id] = {
        playerId: p.id,
        totalScore: 0,
        winCount: 0,
        lossCount: 0,
        gameCount: 0,
        scoreTrend: [{ timestamp: p.createdAt, score: 0 }],
      };
    });

    // Sort sessions by timestamp
    const sortedSessions = [...sessions].sort((a, b) => a.timestamp - b.timestamp);

    sortedSessions.forEach((session) => {
      session.records.forEach((record) => {
        if (stats[record.playerId]) {
          const s = stats[record.playerId];
          s.totalScore += record.score;
          s.gameCount += 1;
          if (record.score > 0) s.winCount += 1;
          else if (record.score < 0) s.lossCount += 1;
          
          const lastScore = s.scoreTrend[s.scoreTrend.length - 1].score;
          s.scoreTrend.push({
            timestamp: session.timestamp,
            score: lastScore + record.score,
          });
        }
      });
    });

    return Object.values(stats).sort((a, b) => b.totalScore - a.totalScore);
  }, [players, sessions]);

  const chartData = useMemo(() => {
    const allTimestamps = Array.from(new Set(sessions.map((s) => s.timestamp))).sort((a, b) => a - b);
    
    return allTimestamps.map((ts) => {
      const dataPoint: any = { timestamp: new Date(ts).toLocaleDateString() };
      players.forEach((p) => {
        const pStats = playerStats.find((ps) => ps.playerId === p.id);
        const trendPoint = pStats?.scoreTrend.find((tp) => tp.timestamp === ts);
        if (trendPoint) {
          dataPoint[p.nickname] = trendPoint.score;
        } else {
          // Find the last score before this timestamp
          const lastPoint = pStats?.scoreTrend
            .filter((tp) => tp.timestamp <= ts)
            .sort((a, b) => b.timestamp - a.timestamp)[0];
          dataPoint[p.nickname] = lastPoint?.score || 0;
        }
      });
      return dataPoint;
    });
  }, [players, sessions, playerStats]);

  const colors = ['#5a5a40', '#f27d26', '#4a90e2', '#e24a4a', '#a24ae2', '#4ae2a2'];

  return (
    <div className="space-y-12">
      {/* Leaderboard */}
      <div className="space-y-6">
        <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
          <Trophy size={24} className="text-olive" />
          玩家排行榜
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playerStats.map((stat, index) => {
            const player = players.find((p) => p.id === stat.playerId);
            return (
              <div key={stat.playerId} className="card p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Trophy size={80} />
                </div>
                
                <div className="flex items-center gap-4 mb-6 relative">
                  <div className="relative">
                    <img
                      src={player?.avatarUrl}
                      alt={player?.nickname}
                      className="w-16 h-16 rounded-full object-cover border-4 border-paper"
                      referrerPolicy="no-referrer"
                    />
                    <div className={cn(
                      "absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md",
                      index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : index === 2 ? "bg-amber-600" : "bg-olive/40"
                    )}>
                      {index + 1}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-serif font-bold">{player?.nickname}</h3>
                    <p className="text-xs text-ink/40 uppercase tracking-widest">
                      {stat.gameCount} 场对局
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 relative">
                  <div className="space-y-1">
                    <p className="text-xs text-ink/40 uppercase font-medium">总分</p>
                    <p className={cn(
                      "text-2xl font-bold",
                      stat.totalScore > 0 ? "text-green-600" : stat.totalScore < 0 ? "text-red-600" : "text-ink"
                    )}>
                      {stat.totalScore > 0 ? '+' : ''}{stat.totalScore}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-ink/40 uppercase font-medium">胜率</p>
                    <p className="text-2xl font-bold text-ink">
                      {stat.gameCount > 0 ? Math.round((stat.winCount / stat.gameCount) * 100) : 0}%
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-black/5 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp size={14} />
                    <span>{stat.winCount} 胜</span>
                  </div>
                  <div className="flex items-center gap-1 text-red-500">
                    <TrendingDown size={14} />
                    <span>{stat.lossCount} 负</span>
                  </div>
                  <div className="flex items-center gap-1 text-ink/40">
                    <Minus size={14} />
                    <span>{stat.gameCount - stat.winCount - stat.lossCount} 平</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trend Chart */}
      {sessions.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
            <TrendingUp size={24} className="text-olive" />
            输赢走势分析
          </h2>
          <div className="card p-8 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#00000010" />
                <XAxis 
                  dataKey="timestamp" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#1a1a1a60' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#1a1a1a60' }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' 
                  }} 
                />
                <Legend iconType="circle" />
                {players.map((p, i) => (
                  <Line
                    key={p.id}
                    type="monotone"
                    dataKey={p.nickname}
                    stroke={colors[i % colors.length]}
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
