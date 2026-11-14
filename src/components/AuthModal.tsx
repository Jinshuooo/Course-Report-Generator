import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../contexts/AppContext';
import { LogIn, User, BookOpen, CheckCircle2, AlertCircle } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { setIsGuest } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

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
        setSuccessMsg('注册成功！若您的项目开启了邮箱验证，请查收验证邮件后再行登录。');
        setIsLogin(true);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '认证失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = () => {
    setIsGuest(true);
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: 'var(--color-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="cs-auth-card cs-card"
        style={{
          width: '100%',
          maxWidth: '860px',
          padding: 0,
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: '1fr',
          animation: 'cs-modal-scale var(--dur-modal) var(--ease-out) forwards',
        }}
      >
        {/* Left Editorial Panel (Ink) */}
        <div
          className="cs-auth-hero"
          style={{
            backgroundColor: 'var(--color-ink)',
            color: '#FFFFFF',
            padding: '40px 32px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          <div>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'var(--color-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                marginBottom: '24px',
                boxShadow: '0 4px 12px rgba(55, 53, 47, 0.25)',
              }}
            >
              <BookOpen size={24} />
            </div>

            <h1
              style={{
                fontSize: '24px',
                fontWeight: 600,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                marginBottom: '12px',
                lineHeight: 1.3,
              }}
            >
              课堂反馈报告生成器
            </h1>

            <p
              style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.72)',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              一键将简略随笔转化为体面、清晰的专业课堂反馈。
            </p>
          </div>
        </div>

        {/* Right Form Panel */}
        <div
          style={{
            padding: '36px 32px',
            backgroundColor: 'var(--color-card)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-ink)' }}>
              {isLogin ? '欢迎回来' : '注册账号'}
            </h2>
          </div>

          {successMsg && (
            <div
              role="status"
              style={{
                backgroundColor: 'var(--color-success-soft)',
                border: '1px solid rgba(46, 125, 91, 0.25)',
                color: 'var(--color-success)',
                padding: '12px 14px',
                borderRadius: 'var(--radius-control)',
                fontSize: '13px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div
              role="alert"
              style={{
                backgroundColor: 'var(--color-error-soft)',
                border: '1px solid rgba(184, 67, 58, 0.25)',
                color: 'var(--color-error)',
                padding: '12px 14px',
                borderRadius: 'var(--radius-control)',
                fontSize: '13px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="cs-form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="auth-email" className="cs-label">
                邮箱地址
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
              />
            </div>

            <div className="cs-form-group" style={{ marginBottom: 0 }}>
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
              className="cs-btn"
              style={{ width: '100%', marginTop: '6px' }}
            >
              {loading ? (
                <span>正在处理...</span>
              ) : (
                <>
                  <LogIn size={16} />
                  <span>{isLogin ? '登录并云端同步' : '注册新账号'}</span>
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccessMsg('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-ink)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: '4px',
              }}
            >
              {isLogin ? '没有账号？点击注册' : '已有账号？点击登录'}
            </button>
          </div>

          {/* Divider */}
          <div style={{ position: 'relative', margin: '20px 0 16px' }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '100%', borderTop: '1px solid var(--color-hairline)' }} />
            </div>
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <span style={{ padding: '0 10px', backgroundColor: 'var(--color-card)', color: 'var(--color-ink-3)', fontSize: '12px' }}>
                或者
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGuestMode}
            className="cs-btn cs-btn-secondary"
            style={{ width: '100%' }}
          >
            <User size={16} />
            <span>免登录直接使用 (仅本地存储)</span>
          </button>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .cs-auth-card {
            grid-template-columns: 48% 52% !important;
          }
        }
        @media (max-width: 767px) {
          .cs-auth-hero {
            padding: 24px 20px !important;
          }
          .cs-auth-hero-feature {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
