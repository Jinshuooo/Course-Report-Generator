import React, { useState } from 'react';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { WelcomePage } from './components/WelcomePage';
import { SettingsModal } from './components/SettingsModal';
import { ReportGenerator } from './components/ReportGenerator';
import { ApiUsageDashboard } from './components/ApiUsageDashboard';
import { BookOpen, Settings, LogOut, Activity, Loader2, Monitor, Sun, Moon } from 'lucide-react';
import { THEME_LABEL, nextThemeMode, useTheme } from './lib/theme';

const THEME_ICON = {
  system: Monitor,
  light: Sun,
  dark: Moon,
} as const;

const MainApp: React.FC = () => {
  const { user, isGuest, loading, logout, apiKey } = useAppContext();
  const [showSettings, setShowSettings] = useState(false);
  const [showUsage, setShowUsage] = useState(false);
  const { mode: themeMode, cycle: cycleTheme } = useTheme();

  if (loading) {
    return (
      <div className="cs-loading-screen">
        <Loader2 size={32} className="cs-spinning" aria-hidden="true" />
        <span className="cs-loading-label">正在加载系统…</span>
      </div>
    );
  }

  // 未登录且非游客：先看欢迎页，由它引导到登录或游客模式
  if (!user && !isGuest) {
    return <WelcomePage />;
  }

  // If no API key configured, force settings modal
  const needsConfig = !apiKey;

  const ThemeIcon = THEME_ICON[themeMode];
  const nextThemeLabel = THEME_LABEL[nextThemeMode(themeMode)];

  return (
    <div className="cs-app-shell">
      {/* Sticky Translucent Header */}
      <header className="cs-header-shell">
        <div className="cs-container cs-header-inner cs-header-enter">
          {/* Brand mark & title */}
          <div className="cs-brand">
            <div className="cs-brand-mark" aria-hidden="true">
              <BookOpen size={20} />
            </div>
            <h1 className="cs-brand-title">课堂反馈系统</h1>
          </div>

          {/* Right Action Group */}
          <div className="cs-header-actions">
            <div
              className="cs-status-pill"
              title={isGuest ? '游客模式 (数据仅本地保存)' : `已登录: ${user?.email}`}
            >
              {isGuest ? '游客模式' : user?.email}
            </div>

            <button
              type="button"
              onClick={cycleTheme}
              className="cs-btn-icon"
              title={`主题：${THEME_LABEL[themeMode]}（点击切换为${nextThemeLabel}）`}
              aria-label={`主题：${THEME_LABEL[themeMode]}，点击切换为${nextThemeLabel}`}
            >
              <ThemeIcon size={20} />
            </button>

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
      <main className="cs-main">
        <div className="cs-container">
          <ReportGenerator />
        </div>
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
