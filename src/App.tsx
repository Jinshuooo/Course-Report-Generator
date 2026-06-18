import React, { useState } from 'react';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { ReportGenerator } from './components/ReportGenerator';
import { ApiUsageDashboard } from './components/ApiUsageDashboard';
import { BookOpen, Settings, LogOut, Activity } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, isGuest, loading, logout, apiKey } = useAppContext();
  const [showSettings, setShowSettings] = useState(false);
  const [showUsage, setShowUsage] = useState(false);

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>加载中...</div>;
  }

  // 如果既没有登录，也没有选择游客模式
  if (!user && !isGuest) {
    return <AuthModal />;
  }

  // 如果没有配置 API Key，且没在显示设置窗口，则强制显示设置窗口
  const needsConfig = !apiKey;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'var(--color-surface)',
        borderBottom: 'var(--border-width) solid var(--color-primary)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 2px 0 var(--color-muted)'
      }}>
        <div className="cs-container cs-flex cs-items-center cs-justify-between" style={{ height: '4rem', padding: '0 1rem' }}>
          <div className="cs-flex cs-items-center cs-gap-2">
            <div style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-background)',
              padding: '0.4rem',
              borderRadius: 'var(--radius)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BookOpen size={20} />
            </div>
            <h1 className="cs-title" style={{ fontSize: '1.25rem', margin: 0, letterSpacing: '-0.02em' }}>课堂反馈系统</h1>
          </div>

          <div className="cs-flex cs-items-center cs-gap-4">
            <div style={{ fontSize: '0.875rem', color: 'var(--color-secondary)' }}>
              {isGuest ? '游客模式 (本地)' : `已登录: ${user?.email}`}
            </div>

            <button
              onClick={() => setShowUsage(true)}
              className="cs-btn-icon"
              title="API 用量统计"
            >
              <Activity size={20} />
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className="cs-btn-icon"
              title="设置 API Key"
            >
              <Settings size={20} />
            </button>

            <button
              onClick={logout}
              className="cs-btn-icon"
              title="退出/切换账号"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="cs-container" style={{ flex: 1, padding: '1.5rem 1rem' }}>
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
