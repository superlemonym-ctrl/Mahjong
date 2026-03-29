import React, { useState } from 'react';
import { Lock, Key, LogIn } from 'lucide-react';
import { motion } from 'motion/react';
import { signInWithPopup, auth, googleProvider } from '../firebase';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'auth' | 'key'>('auth');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      setStep('key');
    } catch (err: any) {
      setError('Google 登录失败，请重试');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key === '260328') {
      onLogin();
    } else {
      setError('密钥错误，请重新输入');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-black/5"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-olive rounded-2xl flex items-center justify-center text-white shadow-lg shadow-olive/20 mb-4">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-serif font-bold text-ink">麻将计分助手</h1>
          <p className="text-ink/40 text-sm mt-1">
            {step === 'auth' ? '请先登录以继续' : '请输入访问密钥'}
          </p>
        </div>

        {step === 'auth' ? (
          <div className="space-y-6">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-4 bg-white border border-black/10 text-ink rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-black/5 transition-all disabled:opacity-50"
            >
              <LogIn size={20} />
              {loading ? '正在登录...' : '使用 Google 账号登录'}
            </button>
            {error && (
              <p className="text-red-500 text-sm text-center font-medium">{error}</p>
            )}
          </div>
        ) : (
          <form onSubmit={handleKeySubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-ink/60 uppercase tracking-widest ml-1">
                访问密钥
              </label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30" size={18} />
                <input
                  type="password"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="请输入 6 位数字密钥"
                  className="w-full pl-12 pr-4 py-3 bg-paper rounded-xl border border-transparent focus:border-olive/20 focus:bg-white transition-all outline-none font-mono"
                  required
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center font-medium">{error}</p>
            )}

            <button
              type="submit"
              className="w-full py-4 bg-olive text-white rounded-xl font-bold shadow-lg shadow-olive/20 hover:bg-olive/90 transition-all"
            >
              进入系统
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-[10px] text-ink/20 uppercase tracking-[0.2em]">
          Secure Access Control
        </p>
      </motion.div>
    </div>
  );
}
