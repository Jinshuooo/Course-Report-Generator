import React, { useState, useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, ChevronDown, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../contexts/AppContext';

export interface DynamicSelectProps {
  label: string;
  storageKey: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

export const DynamicSelect: React.FC<DynamicSelectProps> = ({
  label,
  storageKey,
  value,
  onChange,
  placeholder = '请选择或添加',
  id,
}) => {
  const [options, setOptions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const [menuPos, setMenuPos] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();
  const selectId = id || generatedId;
  const listboxId = `${selectId}-listbox`;

  const { user, isGuest } = useAppContext();

  useEffect(() => {
    const fetchOptions = async () => {
      if (!isGuest && user) {
        try {
          const { data, error } = await supabase
            .from('user_data')
            .select('value')
            .eq('user_id', user.id)
            .eq('key', storageKey)
            .single();

          if (error) throw error;

          if (data && data.value) {
            setOptions(data.value as string[]);
            return;
          }
        } catch (err) {
          console.error('Failed to fetch user_data:', err);
        }
      }

      // Fallback to localStorage
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          setOptions(JSON.parse(saved));
        } catch {
          setOptions([]);
        }
      }
    };

    fetchOptions();
  }, [storageKey, user, isGuest]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      // 下拉面板通过 portal 挂到 body，不在 container 内
      if (menuRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 面板 fixed 定位，跟随滚动与窗口变化重算
  useEffect(() => {
    if (!isOpen) return;

    const reposition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const top = rect.bottom + 8;
      setMenuPos({
        top,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.max(160, window.innerHeight - top - 12),
      });
    };

    reposition();
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [isOpen]);

  const openDropdown = () => {
    const idx = options.indexOf(value);
    setActiveIndex(idx >= 0 ? idx : 0);

    const trigger = triggerRef.current;
    if (trigger) {
      const rect = trigger.getBoundingClientRect();
      const top = rect.bottom + 8;
      setMenuPos({
        top,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.max(160, window.innerHeight - top - 12),
      });
    }
    setIsOpen(true);
  };

  const closeDropdown = () => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const toggleDropdown = () => {
    if (isOpen) {
      setIsOpen(false);
    } else {
      openDropdown();
    }
  };

  const saveOptions = async (newOptions: string[]) => {
    setOptions(newOptions);
    localStorage.setItem(storageKey, JSON.stringify(newOptions));

    if (!isGuest && user) {
      try {
        await supabase.from('user_data').upsert({
          user_id: user.id,
          key: storageKey,
          value: newOptions,
        }, { onConflict: 'user_id,key' });
      } catch (err) {
        console.error('Failed to save user_data:', err);
      }
    }
  };

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (options.includes(trimmed)) {
      setErrorMsg('该选项已存在');
      setTimeout(() => setErrorMsg(''), 1800);
      return;
    }
    const newOptions = [...options, trimmed];
    saveOptions(newOptions);
    onChange(trimmed);
    setInputValue('');
    setErrorMsg('');
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleDelete = (e: React.MouseEvent, optionToRemove: string) => {
    e.stopPropagation();
    const newOptions = options.filter(opt => opt !== optionToRemove);
    saveOptions(newOptions);
    if (value === optionToRemove) {
      onChange('');
    }
  };

  const handleSelect = (opt: string) => {
    onChange(opt);
    closeDropdown();
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDropdown();
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      closeDropdown();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1 < options.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 >= 0 ? prev - 1 : options.length - 1));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < options.length) {
        handleSelect(options[activeIndex]);
      }
    }
  };

  return (
    <div className="cs-form-group" ref={containerRef} style={{ position: 'relative' }}>
      <label htmlFor={selectId} className="cs-label">
        {label}
      </label>

      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={isOpen && activeIndex >= 0 && activeIndex < options.length ? `${selectId}-opt-${activeIndex}` : undefined}
        aria-label={label}
        className="cs-select-trigger"
        onClick={toggleDropdown}
        onKeyDown={handleTriggerKeyDown}
      >
        <span
          className="cs-select-value"
          style={{ color: value ? 'var(--color-ink)' : 'var(--color-ink-3)', fontWeight: value ? 500 : 400 }}
        >
          {value || placeholder}
        </span>
        <ChevronDown size={18} className={`cs-select-chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && menuPos && createPortal(
        <div
          ref={menuRef}
          className="cs-select-dropdown is-fixed"
          style={{
            top: menuPos.top,
            left: menuPos.left,
            width: menuPos.width,
            maxHeight: menuPos.maxHeight,
          }}
        >
          {/* Add-new Section */}
          <div className="cs-select-add">
            <div className="cs-select-add-row">
              <input
                ref={addInputRef}
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAdd();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setIsOpen(false);
                    triggerRef.current?.focus();
                  }
                }}
                placeholder="输入新项目并添加..."
                aria-label={`添加新${label}`}
                className="cs-input"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAdd();
                }}
                className="cs-btn cs-btn-coral"
                style={{ flexShrink: 0 }}
                disabled={!inputValue.trim()}
                title="添加新项"
                aria-label="添加新项"
              >
                <Plus size={16} />
                <span>添加</span>
              </button>
            </div>
            {errorMsg && (
              <div role="alert" className="cs-select-error">
                {errorMsg}
              </div>
            )}
          </div>

          {/* Options List */}
          <div
            id={listboxId}
            role="listbox"
            tabIndex={-1}
            aria-label={label}
            className="cs-select-options"
          >
            {options.length === 0 ? (
              <div className="cs-select-empty">
                暂无预设选项，请在上方添加
              </div>
            ) : (
              options.map((opt, index) => {
                const isSelected = value === opt;
                const isActive = activeIndex === index;
                return (
                  <div
                    key={opt}
                    id={`${selectId}-opt-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    className={`cs-select-option ${isSelected ? 'is-selected' : ''}`}
                    style={{
                      backgroundColor: isActive && !isSelected ? 'var(--color-elevated)' : undefined,
                    }}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <div className="cs-select-option-label">
                      {isSelected && <Check size={16} color="var(--color-coral)" style={{ flexShrink: 0 }} />}
                      <span className="cs-select-option-text">
                        {opt}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, opt)}
                      className="cs-select-delete-btn"
                      title={`删除「${opt}」`}
                      aria-label={`删除「${opt}」`}
                    >
                      <X size={15} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
