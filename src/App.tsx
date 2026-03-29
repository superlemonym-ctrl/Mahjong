import React, { useState, useEffect } from 'react';
import { Trophy, Users, TrendingUp, PlusCircle, History, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PlayerManager from './components/PlayerManager';
import ScoreTracker from './components/ScoreTracker';
import StatsDashboard from './components/StatsDashboard';
import Login from './components/Login';
import ErrorBoundary from './components/ErrorBoundary';
import { Player, GameSession } from './types';
import { cn } from './lib/utils';
import { db, auth, collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, onAuthStateChanged } from './firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

type Tab = 'players' | 'scores' | 'stats';

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('players');
  const [user, setUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecking(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const playersUnsubscribe = onSnapshot(
      collection(db, 'players'),
      (snapshot) => {
        const playersData = snapshot.docs.map(doc => doc.data() as Player);
        setPlayers(playersData);
        setLoading(false);
      },
      (error) => {
        if (error.code !== 'permission-denied' || auth.currentUser) {
          handleFirestoreError(error, OperationType.GET, 'players');
        }
      }
    );

    const sessionsUnsubscribe = onSnapshot(
      query(collection(db, 'sessions'), orderBy('timestamp', 'desc')),
      (snapshot) => {
        const sessionsData = snapshot.docs.map(doc => doc.data() as GameSession);
        setSessions(sessionsData);
      },
      (error) => {
        if (error.code !== 'permission-denied' || auth.currentUser) {
          handleFirestoreError(error, OperationType.GET, 'sessions');
        }
      }
    );

    return () => {
      playersUnsubscribe();
      sessionsUnsubscribe();
    };
  }, [user]);

  const handleLogin = () => {
    // Auth state will be updated by onAuthStateChanged
  };

  const handleAddPlayer = async (player: Player) => {
    try {
      await setDoc(doc(db, 'players', player.id), player);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `players/${player.id}`);
    }
  };

  const handleUpdatePlayer = async (updatedPlayer: Player) => {
    try {
      await setDoc(doc(db, 'players', updatedPlayer.id), updatedPlayer);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `players/${updatedPlayer.id}`);
    }
  };

  const handleDeletePlayer = async (id: string) => {
    if (confirm('确定要删除这位玩家吗？相关的计分记录也将受到影响。')) {
      try {
        await deleteDoc(doc(db, 'players', id));
        // Also delete sessions involving this player (optional, or just filter in UI)
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `players/${id}`);
      }
    }
  };

  const handleSaveSession = async (session: GameSession) => {
    try {
      await setDoc(doc(db, 'sessions', session.id), session);
      setActiveTab('stats');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `sessions/${session.id}`);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (confirm('确定要删除这条对局记录吗？')) {
      try {
        await deleteDoc(doc(db, 'sessions', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `sessions/${id}`);
      }
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="w-8 h-8 border-4 border-olive border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-olive border-t-transparent rounded-full animate-spin" />
          <p className="text-ink/40 font-serif italic">正在同步云端数据...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'players', label: '玩家', icon: Users },
    { id: 'scores', label: '计分', icon: PlusCircle },
    { id: 'stats', label: '排名走势', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pl-24 bg-paper">
      {/* Sidebar Navigation (Desktop) */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-24 bg-white border-r border-black/5 flex-col items-center py-8 gap-8 z-50">
        <div className="w-12 h-12 bg-olive rounded-2xl flex items-center justify-center text-white shadow-lg shadow-olive/20 mb-4">
          <Trophy size={24} />
        </div>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={cn(
              "p-4 rounded-2xl transition-all group relative",
              activeTab === tab.id ? "bg-olive text-white shadow-md" : "text-ink/40 hover:bg-olive/5 hover:text-olive"
            )}
          >
            <tab.icon size={24} />
            <span className="absolute left-full ml-4 px-2 py-1 bg-ink text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {tab.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-black/5 flex items-center justify-around px-4 z-50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              activeTab === tab.id ? "text-olive" : "text-ink/40"
            )}
          >
            <tab.icon size={20} />
            <span className="text-[10px] font-medium uppercase tracking-tighter">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-6 md:p-12">
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-ink mb-2">
            麻将计分助手
          </h1>
          <p className="text-ink/40 font-serif italic text-lg">
            记录每一场博弈，见证每一份成长。
          </p>
        </header>

        <AnimatePresence mode="wait">
          <motion.section
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'players' && (
              <PlayerManager
                players={players}
                onAddPlayer={handleAddPlayer}
                onUpdatePlayer={handleUpdatePlayer}
                onDeletePlayer={handleDeletePlayer}
              />
            )}

            {activeTab === 'scores' && (
              <div className="space-y-12">
                <ScoreTracker players={players} onSaveSession={handleSaveSession} />
                
                {sessions.length > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-serif font-semibold flex items-center gap-2">
                      <History size={20} className="text-olive" />
                      历史对局记录
                    </h3>
                    <div className="space-y-4">
                      {sessions.map((session) => (
                        <div key={session.id} className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-medium text-ink/40 uppercase tracking-widest">
                                {new Date(session.timestamp).toLocaleString()}
                              </span>
                              {session.notes && (
                                <span className="px-2 py-0.5 bg-paper rounded text-[10px] text-ink/60">
                                  {session.notes}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-4">
                              {session.records.map((record) => {
                                const player = players.find((p) => p.id === record.playerId);
                                return (
                                  <div key={record.playerId} className="flex items-center gap-2">
                                    <img
                                      src={player?.avatarUrl}
                                      alt={player?.nickname}
                                      className="w-6 h-6 rounded-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                    <span className="text-sm font-medium">{player?.nickname}</span>
                                    <span className={cn(
                                      "text-sm font-bold",
                                      record.score > 0 ? "text-green-600" : record.score < 0 ? "text-red-600" : "text-ink/40"
                                    )}>
                                      {record.score > 0 ? '+' : ''}{record.score}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            className="p-2 hover:bg-red-50 rounded-full text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'stats' && (
              <StatsDashboard players={players} sessions={sessions} />
            )}
          </motion.section>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
