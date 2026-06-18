import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../contexts/AppContext';

interface DynamicSelectProps {
  label: string;
  storageKey: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const DynamicSelect: React.FC<DynamicSelectProps> = ({
  label,
  storageKey,
  value,
  onChange,
  placeholder = '请选择或添加'
}) => {
  const [options, setOptions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

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
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveOptions = async (newOptions: string[]) => {
    setOptions(newOptions);
    localStorage.setItem(storageKey, JSON.stringify(newOptions));

    if (!isGuest && user) {
      try {
        await supabase.from('user_data').upsert({
          user_id: user.id,
          key: storageKey,
          value: newOptions
        });
      } catch (err) {
        console.error('Failed to save user_data:', err);
      }
    }
  };

  const handleAdd = () => {
    if (inputValue.trim() && !options.includes(inputValue.trim())) {
      const newOptions = [...options, inputValue.trim()];
      saveOptions(newOptions);
      onChange(inputValue.trim());
      setInputValue('');
      setIsOpen(false);
    }
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
    setIsOpen(false);
  };

  return (
    <div className="cs-flex-col cs-mb-4" ref={containerRef} style={{ position: 'relative' }}>
      <label className="cs-label">{label}</label>
      
      <div 
        className="cs-input cs-flex cs-items-center cs-justify-between" 
        style={{ cursor: 'pointer', background: 'var(--color-surface)' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{value || <span style={{ color: 'var(--color-muted)' }}>{placeholder}</span>}</span>
        <ChevronDown size={18} color="var(--color-secondary)" />
      </div>

      {isOpen && (
        <div className="cs-select-dropdown">
          <div className="cs-flex" style={{ padding: '0.5rem', borderBottom: '1px solid var(--color-surface)' }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
              placeholder="输入新选项..."
              className="cs-input"
              style={{ padding: '0.5rem', marginRight: '0.5rem' }}
              onClick={(e) => e.stopPropagation()}
            />
            <button 
              onClick={(e) => { e.stopPropagation(); handleAdd(); }}
              className="cs-btn" 
              style={{ padding: '0.5rem 1rem' }}
              disabled={!inputValue.trim()}
            >
              <Plus size={16} />
            </button>
          </div>
          
          {options.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-muted)' }}>
              暂无选项，请添加
            </div>
          ) : (
            options.map(opt => (
              <div 
                key={opt} 
                className="cs-select-option"
                onClick={() => handleSelect(opt)}
                style={{ 
                  backgroundColor: value === opt ? 'var(--color-surface)' : 'transparent',
                  fontWeight: value === opt ? '600' : 'normal'
                }}
              >
                <span>{opt}</span>
                <button 
                  onClick={(e) => handleDelete(e, opt)}
                  className="cs-btn-icon"
                  title="删除此选项"
                >
                  <X size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
