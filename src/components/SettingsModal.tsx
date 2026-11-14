import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Modal } from './ui/Modal';
import { Key, Save, Eye, EyeOff, Check, ExternalLink } from 'lucide-react';

export interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { apiKey, setApiKey, isGuest } = useAppContext();
  const [localKey, setLocalKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const isForced = !apiKey;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localKey.trim()) return;
    setApiKey(localKey.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 900);
  };

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
        <Key size={18} />
      </div>
      <span>API 配置</span>
    </div>
  );

  const descriptionContent = isGuest
    ? '游客模式 · Key 仅保存在本地浏览器'
    : '已登录 · Key 同步至您的云端账户';

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      dismissible={!isForced}
      title={titleContent}
      description={descriptionContent}
      maxWidth="460px"
    >
      <form onSubmit={handleSave}>
        <div className="cs-form-group">
          <label htmlFor="deepseek-api-key" className="cs-label">
            DeepSeek API Key
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              id="deepseek-api-key"
              type={showKey ? 'text' : 'password'}
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
              placeholder="sk-..."
              required
              className="cs-input"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '16px',
                paddingRight: '48px',
              }}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="cs-btn-icon"
              style={{ position: 'absolute', right: '4px', height: '38px', width: '38px' }}
              title={showKey ? '隐藏密钥' : '显示密钥'}
              aria-label={showKey ? '隐藏密钥' : '显示密钥'}
            >
              {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--color-ink-3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>前往</span>
            <a
              href="https://platform.deepseek.com/"
              target="_blank"
              rel="noreferrer"
              style={{
                color: 'var(--color-ink)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                textDecoration: 'underline',
                fontWeight: 500,
              }}
            >
              DeepSeek 开放平台
              <ExternalLink size={12} />
            </a>
            <span>获取 Key</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={!localKey.trim() || saved}
          className="cs-btn"
          style={{
            width: '100%',
            marginTop: '8px',
            backgroundColor: saved ? 'var(--color-success)' : undefined,
          }}
        >
          {saved ? (
            <>
              <Check size={18} />
              <span>已保存</span>
            </>
          ) : (
            <>
              <Save size={18} />
              <span>保存设置</span>
            </>
          )}
        </button>
      </form>
    </Modal>
  );
};
