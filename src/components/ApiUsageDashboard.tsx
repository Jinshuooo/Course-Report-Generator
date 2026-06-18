import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Activity, Calendar, Hash } from 'lucide-react';
import { fetchStats, fetchDeepSeekBalance } from '../lib/usageTracker';
import { useAppContext } from '../contexts/AppContext';

interface ApiUsageDashboardProps {
  onClose: () => void;
}

export const ApiUsageDashboard: React.FC<ApiUsageDashboardProps> = ({ onClose }) => {
  const { apiKey, user, isGuest } = useAppContext();
  const [stats, setStats] = useState({
    today: { totalTokens: 0, estimatedCost: 0 },
    month: { totalTokens: 0, estimatedCost: 0 },
    total: { totalTokens: 0, estimatedCost: 0 }
  });
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    // Load Stats
    try {
      const fetchedStats = await fetchStats(user?.id, isGuest);
      setStats(fetchedStats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }

    // Load Balance
    if (!apiKey) return;
    setLoading(true);
    setError('');
    try {
      const bal = await fetchDeepSeekBalance(apiKey);
      setBalance(bal);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '获取余额失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    // Set up an interval to refresh local stats every minute just in case
    const interval = setInterval(() => {
      loadData();
    }, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, user, isGuest]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(55, 53, 47, 0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '1rem'
    }}>
      <div className="cs-card cs-flex-col" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="cs-flex cs-items-center cs-justify-between cs-mb-4">
          <h2 className="cs-title cs-flex cs-items-center cs-gap-2">
            <Activity size={24} />
            API 用量统计
          </h2>
          <button onClick={onClose} className="cs-btn-icon">
            <X size={20} />
          </button>
        </div>

        <div className="cs-flex-col cs-gap-4">
          {/* Balance Section */}
          <div style={{ backgroundColor: 'var(--color-surface)', padding: '1.25rem', borderRadius: 'var(--radius)', border: '1px solid rgba(55, 53, 47, 0.09)' }}>
            <div className="cs-flex cs-items-center cs-justify-between cs-mb-2">
              <span className="cs-label" style={{ margin: 0 }}>云端账户余额 (CNY)</span>
              <button 
                onClick={loadData} 
                disabled={loading} 
                className="cs-btn-icon" 
                title="刷新数据"
                style={{ padding: '0.25rem' }}
              >
                <RefreshCw size={16} className={loading ? 'spinning' : ''} />
              </button>
            </div>
            {error ? (
              <div style={{ color: 'var(--color-error)', fontSize: '0.875rem' }}>{error}</div>
            ) : (
              <div style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-primary)' }}>
                ¥ {balance !== null ? balance : '--'}
              </div>
            )}
            {!apiKey && (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-warning)', marginTop: '0.5rem' }}>未配置 API Key，无法查询余额。</div>
            )}
          </div>

          <p style={{ fontSize: '0.875rem', color: 'var(--color-secondary)' }}>
            以下是本设备记录的生成用量（预估消费按官方标准 1元/1M Input, 2元/1M Output 估算）。
          </p>

          <div className="cs-grid-2" style={{ gap: '1rem' }}>
            {/* Today's Usage */}
            <div style={{ border: '1px solid rgba(55, 53, 47, 0.16)', padding: '1rem', borderRadius: 'var(--radius)' }}>
              <div className="cs-flex cs-items-center cs-gap-2 cs-mb-2">
                <Calendar size={16} color="var(--color-secondary)" />
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>本日用量</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: '0.5rem' }}>
                {stats.today.totalTokens.toLocaleString()} <span style={{ fontSize: '0.875rem', fontWeight: 400, fontFamily: 'var(--font-body)', color: 'var(--color-secondary)' }}>Tokens</span>
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-secondary)' }}>
                预估消费: ¥ {stats.today.estimatedCost.toFixed(4)}
              </div>
            </div>

            {/* This Month's Usage */}
            <div style={{ border: '1px solid rgba(55, 53, 47, 0.16)', padding: '1rem', borderRadius: 'var(--radius)' }}>
              <div className="cs-flex cs-items-center cs-gap-2 cs-mb-2">
                <Hash size={16} color="var(--color-secondary)" />
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>本月用量</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: '0.5rem' }}>
                {stats.month.totalTokens.toLocaleString()} <span style={{ fontSize: '0.875rem', fontWeight: 400, fontFamily: 'var(--font-body)', color: 'var(--color-secondary)' }}>Tokens</span>
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-secondary)' }}>
                预估消费: ¥ {stats.month.estimatedCost.toFixed(4)}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(55, 53, 47, 0.09)', paddingTop: '1rem' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-secondary)' }}>
              累计总用量: {stats.total.totalTokens.toLocaleString()} Tokens (约 ¥{stats.total.estimatedCost.toFixed(4)})
            </div>
          </div>
        </div>
      </div>
      
      <style>
        {`
          @keyframes spin {
            100% { transform: rotate(360deg); }
          }
          .spinning {
            animation: spin 1s linear infinite;
          }
        `}
      </style>
    </div>
  );
};
