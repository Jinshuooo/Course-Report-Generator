import React, { useState, useEffect } from 'react';
import { RefreshCw, Activity, Calendar, Coins } from 'lucide-react';
import { fetchStats, fetchDeepSeekBalance } from '../lib/usageTracker';
import { useAppContext } from '../contexts/AppContext';
import { Modal } from './ui/Modal';

export interface ApiUsageDashboardProps {
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
    const interval = setInterval(() => {
      loadData();
    }, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, user, isGuest]);

  const titleContent = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          backgroundColor: 'var(--color-coral-soft)',
          color: 'var(--color-coral)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Activity size={18} />
      </div>
      <span>API 用量统计</span>
    </div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={titleContent}
      maxWidth="500px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Balance Card */}
        <div
          style={{
            backgroundColor: 'var(--color-elevated)',
            border: '1px solid var(--color-hairline)',
            borderRadius: 'var(--radius-control)',
            padding: '16px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-ink-2)' }}>
              账户余额 (CNY)
            </span>
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="cs-btn-icon"
              title="刷新余额与用量"
              aria-label="刷新余额与用量"
              style={{ width: '44px', height: '44px' }}
            >
              <RefreshCw size={16} className={loading ? 'cs-spinning' : ''} />
            </button>
          </div>

          {error ? (
            <div role="alert" style={{ color: 'var(--color-error)', fontSize: '13px' }}>
              {error}
            </div>
          ) : (
            <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--color-ink)', letterSpacing: '-0.02em' }} className="cs-tabular">
              ¥ {balance !== null ? balance : '--'}
            </div>
          )}

          {!apiKey && (
            <div style={{ fontSize: '12px', color: 'var(--color-warning)', marginTop: '4px' }}>
              未配置 API Key，无法查询实时余额
            </div>
          )}
        </div>

        {/* Pricing caption */}
        <div style={{ fontSize: '12px', color: 'var(--color-ink-3)', lineHeight: 1.4 }}>
          消费估算基准：DeepSeek-V4-Flash 官方标准（输入 ¥1/1M Tokens，输出 ¥2/1M Tokens）。
        </div>

        {/* 2 Stat Tiles: Today and Month */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* Today */}
          <div
            style={{
              border: '1px solid var(--color-hairline)',
              borderRadius: 'var(--radius-control)',
              padding: '14px',
              backgroundColor: 'var(--color-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: 'var(--color-ink-2)', fontSize: '13px', fontWeight: 500 }}>
              <Calendar size={14} color="var(--color-coral)" />
              <span>今日用量</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-ink)', marginBottom: '4px' }} className="cs-tabular">
              {stats.today.totalTokens.toLocaleString()}{' '}
              <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--color-ink-3)' }}>Tokens</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-ink-2)' }} className="cs-tabular">
              预估: ¥ {stats.today.estimatedCost.toFixed(4)}
            </div>
          </div>

          {/* Month */}
          <div
            style={{
              border: '1px solid var(--color-hairline)',
              borderRadius: 'var(--radius-control)',
              padding: '14px',
              backgroundColor: 'var(--color-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: 'var(--color-ink-2)', fontSize: '13px', fontWeight: 500 }}>
              <Coins size={14} color="var(--color-coral)" />
              <span>本月用量</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-ink)', marginBottom: '4px' }} className="cs-tabular">
              {stats.month.totalTokens.toLocaleString()}{' '}
              <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--color-ink-3)' }}>Tokens</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-ink-2)' }} className="cs-tabular">
              预估: ¥ {stats.month.estimatedCost.toFixed(4)}
            </div>
          </div>
        </div>

        {/* Cumulative total footer */}
        <div
          style={{
            borderTop: '1px solid var(--color-hairline)',
            paddingTop: '12px',
            fontSize: '13px',
            color: 'var(--color-ink-2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
          className="cs-tabular"
        >
          <span>累计总用量</span>
          <span style={{ fontWeight: 500, color: 'var(--color-ink)' }}>
            {stats.total.totalTokens.toLocaleString()} Tokens (约 ¥{stats.total.estimatedCost.toFixed(4)})
          </span>
        </div>
      </div>
    </Modal>
  );
};
