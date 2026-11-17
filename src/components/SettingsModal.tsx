import React, { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Modal, type ModalHandle } from './ui/Modal';
import { Key, Check, Eye, EyeOff, ExternalLink } from 'lucide-react';

export interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { apiKey, setApiKey, isGuest, user } = useAppContext();
  const [localKey, setLocalKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const modalRef = useRef<ModalHandle | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const isForced = !apiKey;

  useEffect(
    () => () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    },
    []
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const key = localKey.trim();
    if (!key || saved) return;
    setApiKey(key);
    setSaved(true);
    saveTimerRef.current = window.setTimeout(() => {
      modalRef.current?.close();
    }, 700);
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
          flexShrink: 0,
        }}
      >
        <Key size={18} />
      </div>
      <span>设置</span>
    </div>
  );

  const canSave = Boolean(localKey.trim()) && !saved;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      dismissible={!isForced}
      title={titleContent}
      description={isForced ? '配置 API Key 后即可开始使用' : undefined}
      maxWidth="560px"
      apiRef={modalRef}
      footer={
        <>
          {!isForced && (
            <button
              type="button"
              onClick={() => modalRef.current?.close()}
              className="cs-btn cs-btn-secondary"
            >
              取消
            </button>
          )}
          <button
            type="submit"
            form="settings-form"
            disabled={!canSave}
            className={`cs-btn${saved ? ' is-saved' : ''}`}
          >
            {saved ? (
              <>
                <Check size={18} />
                <span>已保存</span>
              </>
            ) : (
              <span>保存</span>
            )}
          </button>
        </>
      }
    >
      <form id="settings-form" onSubmit={handleSave}>
        <div className="cs-settings">
          <section
            className="cs-settings-group cs-stagger-item"
            style={{ '--stagger': 0 } as React.CSSProperties}
          >
            <h3 className="cs-settings-group-title">模型服务</h3>

            <div className="cs-field-row">
              <label htmlFor="deepseek-api-key" className="cs-field-label">
                API Key
              </label>
              <div className="cs-field-control">
                <div className="cs-input-affix">
                  <input
                    id="deepseek-api-key"
                    type={showKey ? 'text' : 'password'}
                    value={localKey}
                    onChange={(e) => setLocalKey(e.target.value)}
                    placeholder="sk-..."
                    required
                    className="cs-input cs-input-mono"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="cs-btn-icon cs-input-affix-btn"
                    title={showKey ? '隐藏密钥' : '显示密钥'}
                    aria-label={showKey ? '隐藏密钥' : '显示密钥'}
                  >
                    {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="cs-field-hint">
                  <span>前往</span>
                  <a
                    href="https://platform.deepseek.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="cs-field-link"
                  >
                    DeepSeek 开放平台
                    <ExternalLink size={12} />
                  </a>
                  <span>获取</span>
                </div>
              </div>
            </div>
          </section>

          <section
            className="cs-settings-group cs-stagger-item"
            style={{ '--stagger': 1 } as React.CSSProperties}
          >
            <h3 className="cs-settings-group-title">账户与存储</h3>

            <div className="cs-info-list">
              <div className="cs-info-row">
                <span className="cs-info-key">身份</span>
                <span className="cs-info-value">
                  {isGuest ? '游客模式' : user?.email ?? '未登录'}
                </span>
              </div>
              <div className="cs-info-row">
                <span className="cs-info-key">Key 存储</span>
                <span className="cs-info-value">
                  {isGuest ? '仅本地浏览器' : '云端账户'}
                </span>
              </div>
            </div>
          </section>
        </div>
      </form>
    </Modal>
  );
};
