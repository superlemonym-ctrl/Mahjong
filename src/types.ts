export interface Player {
  id: string;
  nickname: string;
  avatarUrl: string;
  createdAt: number;
}

export interface ScoreRecord {
  playerId: string;
  score: number; // Positive for win, negative for loss
}

export interface GameSession {
  id: string;
  timestamp: number;
  records: ScoreRecord[];
  notes?: string;
}

export interface PlayerStats {
  playerId: string;
  totalScore: number;
  winCount: number;
  lossCount: number;
  gameCount: number;
  scoreTrend: { timestamp: number; score: number }[];
}
