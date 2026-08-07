import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface SimpleSelectProps {
  label?: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const SimpleSelect: React.FC<SimpleSelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = '请选择',
  style,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (opt: string) => {
    onChange(opt);
    setIsOpen(false);
  };

  return (
    <div 
      className={className ?? (label ? "cs-flex-col cs-mb-4" : "cs-flex-col")} 
      ref={containerRef} 
      style={{ position: 'relative', ...style }}
    >
      {label && <label className="cs-label">{label}</label>}
      
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
          {options.map(opt => (
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
