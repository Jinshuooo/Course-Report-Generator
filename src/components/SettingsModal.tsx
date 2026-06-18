import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Key, Save, X } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { apiKey, setApiKey, isGuest } = useAppContext();
  const [localKey, setLocalKey] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setApiKey(localKey);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(10, 10, 10, 0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 50
    }}>
      <div className="cs-card cs-flex-col" style={{ width: '100%', maxWidth: '400px', position: 'relative' }}>
        <button 
          onClick={onClose}
          className="cs-btn-icon"
          style={{ position: 'absolute', top: '1rem', right: '1rem' }}
        >
          <X size={20} />
        </button>
        
        <div className="cs-header">
          <div className="cs-flex cs-items-center cs-gap-2" style={{ color: 'var(--color-primary)' }}>
            <Key size={20} />
            <h2 className="cs-title" style={{ fontSize: '1.25rem' }}>API 配置</h2>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginTop: '0.5rem' }}>
            配置您的 DeepSeek API Key 以生成报告。
            {isGuest ? '当前为游客模式，Key仅保存在本地。' : '当前已登录，Key将安全同步至云端。'}
          </p>
        </div>
        
        <div className="cs-flex-col cs-gap-4">
          <div>
            <label className="cs-label">DeepSeek API Key</label>
            <input
              type="password"
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
              placeholder="sk-..."
              className="cs-input"
              style={{ fontFamily: 'var(--font-heading)' }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '0.5rem' }}>
              前往 <a href="https://platform.deepseek.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>DeepSeek 开放平台</a> 获取您的 Key。
            </p>
          </div>
          
          <button
            onClick={handleSave}
            className="cs-btn"
            style={{ width: '100%' }}
          >
            <Save size={16} />
            {saved ? '已保存！' : '保存设置'}
          </button>
        </div>
      </div>
    </div>
  );
};
