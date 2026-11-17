import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../contexts/AppContext';
import {
  LogIn,
  User,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { setIsGuest } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const shellRef = useRef<HTMLDivElement>(null);

  // Keep the card usable when the mobile keyboard shrinks the visual viewport.
  useEffect(() => {
    const viewport = window.visualViewport;
    const shell = shellRef.current;
    if (!viewport || !shell) return;

    const sync = () => {
      const keyboardOpen = window.innerHeight - viewport.height > 120;
      shell.style.height = keyboardOpen ? `${Math.round(viewport.height)}px` : '';
      shell.style.minHeight = keyboardOpen ? `${Math.round(viewport.height)}px` : '';
      shell.style.alignContent = keyboardOpen ? 'start' : '';
    };

    sync();
    viewport.addEventListener('resize', sync);
    return () => viewport.removeEventListener('resize', sync);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setSuccessMsg('注册成功，请查收验证邮件后登录。');
        setIsLogin(true);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '认证失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccessMsg('');
  };

  const stagger = (index: number) => ({ '--stagger': index } as React.CSSProperties);

  return (
    <div className="cs-auth-shell" ref={shellRef}>
      <div className="cs-auth-card">
        <div className="cs-auth-brand cs-stagger-item" style={stagger(0)}>
          <div className="cs-auth-mark" aria-hidden="true">
            <BookOpen size={18} />
          </div>
          <span>课堂反馈报告生成器</span>
        </div>

        <h1 key={isLogin ? 'login' : 'register'} className="cs-auth-title cs-stagger-item" style={stagger(1)}>
          {isLogin ? '欢迎回来' : '创建账号'}
        </h1>

        {/* Reserved slot: keeps layout stable when messages appear */}
        <div className="cs-auth-message" aria-live="polite">
          {successMsg && (
            <div role="status" className="cs-auth-message-box is-success">
              <CheckCircle2 size={16} aria-hidden="true" />
              <span>{successMsg}</span>
            </div>
          )}
          {error && (
            <div role="alert" className="cs-auth-message-box is-error">
              <AlertCircle size={16} aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleAuth} className="cs-auth-form">
          <div className="cs-form-group cs-stagger-item" style={stagger(2)}>
            <label htmlFor="auth-email" className="cs-label">
              邮箱
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="cs-input"
              placeholder="name@example.com"
              required
              autoComplete="email"
              inputMode="email"
            />
          </div>

          <div className="cs-form-group cs-stagger-item" style={stagger(3)}>
            <label htmlFor="auth-password" className="cs-label">
              密码
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="cs-input"
              placeholder="••••••••"
              required
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`cs-btn cs-auth-submit cs-stagger-item${loading ? ' is-loading' : ''}`}
            style={stagger(4)}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <Loader2 size={17} className="cs-spinning" aria-hidden="true" />
                <span>{isLogin ? '正在登录' : '正在注册'}</span>
              </>
            ) : (
              <>
                <LogIn size={17} aria-hidden="true" />
                <span>{isLogin ? '登录并云端同步' : '注册新账号'}</span>
              </>
            )}
          </button>
        </form>

        <div className="cs-auth-switch-wrap cs-stagger-item" style={stagger(5)}>
          <button type="button" onClick={switchMode} className="cs-auth-switch">
            {isLogin ? '没有账号？注册' : '已有账号？登录'}
          </button>
        </div>

        <div className="cs-auth-divider cs-stagger-item" style={stagger(6)} role="separator">
          <span>或者</span>
        </div>

        <button
          type="button"
          onClick={() => setIsGuest(true)}
          className="cs-btn cs-btn-secondary cs-auth-guest cs-stagger-item"
          style={stagger(7)}
        >
          <User size={17} aria-hidden="true" />
          <span>免登录使用（仅本地存储）</span>
        </button>
      </div>
    </div>
  );
};
