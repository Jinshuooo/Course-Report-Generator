import React, { useState } from 'react';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { ReportGenerator } from './components/ReportGenerator';
import { ApiUsageDashboard } from './components/ApiUsageDashboard';
import { BookOpen, Settings, LogOut, Activity, Loader2 } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, isGuest, loading, logout, apiKey } = useAppContext();
  const [showSettings, setShowSettings] = useState(false);
  const [showUsage, setShowUsage] = useState(false);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-ink-2)',
          gap: '12px',
        }}
      >
        <Loader2 size={32} className="cs-spinning" style={{ color: 'var(--color-coral)' }} />
        <span style={{ fontSize: '14px', fontWeight: 500 }}>正在加载系统...</span>
      </div>
    );
  }

  // If not logged in and not guest, show Auth screen
  if (!user && !isGuest) {
    return <AuthModal />;
  }

  // If no API key configured, force settings modal
  const needsConfig = !apiKey;

  return (
    <div className="cs-app-shell">
      {/* Sticky Translucent Header */}
      <header className="cs-header-shell">
        <div className="cs-container cs-header-inner">
          {/* Brand mark & title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div className="cs-brand-mark" aria-hidden="true">
              <BookOpen size={20} />
            </div>
            <h1 className="cs-brand-title">课堂反馈系统</h1>
          </div>

          {/* Right Action Group */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <div className="cs-status-pill" title={isGuest ? '游客模式 (数据仅本地保存)' : `已登录: ${user?.email}`}>
              {isGuest ? '游客模式' : user?.email}
            </div>

            <button
              type="button"
              onClick={() => setShowUsage(true)}
              className="cs-btn-icon"
              title="API 用量统计"
              aria-label="查看 API 用量统计"
            >
              <Activity size={20} />
            </button>

            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="cs-btn-icon"
              title="设置 API Key"
              aria-label="设置 API Key"
            >
              <Settings size={20} />
            </button>

            <button
              type="button"
              onClick={logout}
              className="cs-btn-icon"
              title="退出登录或切换模式"
              aria-label="退出登录或切换模式"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="cs-container" style={{ flex: 1, paddingTop: '24px' }}>
        <ReportGenerator />
      </main>

      {/* Modals */}
      {(showSettings || needsConfig) && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      {showUsage && (
        <ApiUsageDashboard onClose={() => setShowUsage(false)} />
      )}
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

export default App;
