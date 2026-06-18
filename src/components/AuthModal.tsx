import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../contexts/AppContext';
import { LogIn, User, Sparkles } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { setIsGuest } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('注册成功，请登录！(如果配置了邮箱验证，请先去邮箱验证)');
        setIsLogin(true);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '认证失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = () => {
    setIsGuest(true);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(10, 10, 10, 0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 50
    }}>
      <div className="cs-card cs-flex-col" style={{ width: '100%', maxWidth: '400px', padding: 0, overflow: 'hidden' }}>
        <div style={{ 
          backgroundColor: 'var(--color-primary)', 
          color: 'var(--color-background)', 
          padding: '2rem 1.5rem', 
          textAlign: 'center',
          borderBottom: 'var(--border-width) solid var(--color-primary)'
        }}>
          <div style={{ 
            margin: '0 auto 1rem', 
            width: '4rem', height: '4rem', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            borderRadius: '50%',
            backgroundColor: 'var(--color-secondary)'
          }}>
            <Sparkles size={32} />
          </div>
          <h2 className="cs-title" style={{ fontSize: '1.5rem', margin: 0 }}>课堂反馈报告生成器</h2>
          <p style={{ marginTop: '0.5rem', color: 'var(--color-surface)' }}>一键将简略随笔转化为精美反馈</p>
        </div>
        
        <div style={{ padding: '1.5rem' }}>
          <form onSubmit={handleAuth} className="cs-flex-col cs-gap-4">
            {error && (
              <div style={{ backgroundColor: 'var(--color-error)', color: '#fff', padding: '0.75rem', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}
            
            <div>
              <label className="cs-label">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="cs-input"
                required
              />
            </div>
            
            <div>
              <label className="cs-label">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="cs-input"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="cs-btn"
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {loading ? '处理中...' : (isLogin ? '登录并云端同步' : '注册账号')}
              {!loading && <LogIn size={16} />}
            </button>
          </form>
          
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button
              onClick={() => setIsLogin(!isLogin)}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.875rem' }}
            >
              {isLogin ? '没有账号？点击注册' : '已有账号？点击登录'}
            </button>
          </div>
          
          <div style={{ position: 'relative', margin: '1.5rem 0' }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '100%', borderTop: 'var(--border-width) solid var(--color-primary)' }}></div>
            </div>
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', fontSize: '0.875rem' }}>
              <span style={{ padding: '0 0.5rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-muted)' }}>或者</span>
            </div>
          </div>
          
          <button
            onClick={handleGuestMode}
            className="cs-btn cs-btn-secondary"
            style={{ width: '100%' }}
          >
            <User size={16} />
            免登录直接使用 (仅本地存储)
          </button>
        </div>
      </div>
    </div>
  );
};
