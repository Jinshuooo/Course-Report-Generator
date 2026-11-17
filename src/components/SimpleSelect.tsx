import React, { useState, useEffect, useRef, useId } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SimpleSelectProps {
  label?: string;
  id?: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  className?: string;
  ariaLabel?: string;
}

export const SimpleSelect: React.FC<SimpleSelectProps> = ({
  label,
  id,
  options,
  value,
  onChange,
  placeholder = '请选择',
  style,
  className,
  ariaLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const selectId = id || generatedId;
  const listboxId = `${selectId}-listbox`;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openDropdown = () => {
    const idx = options.indexOf(value);
    setActiveIndex(idx >= 0 ? idx : 0);
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

  const handleSelect = (opt: string) => {
    onChange(opt);
    closeDropdown();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
    <div
      className={className ?? (label ? 'cs-form-group' : '')}
      ref={containerRef}
      style={{ position: 'relative', ...style }}
    >
      {label && (
        <label htmlFor={selectId} className="cs-label">
          {label}
        </label>
      )}

      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={isOpen && activeIndex >= 0 && activeIndex < options.length ? `${selectId}-opt-${activeIndex}` : undefined}
        aria-label={ariaLabel || label || placeholder}
        className="cs-select-trigger"
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
      >
        <span
          className="cs-select-value"
          style={{ color: value ? 'var(--color-ink)' : 'var(--color-ink-3)', fontWeight: value ? 500 : 400 }}
        >
          {value || placeholder}
        </span>
        <ChevronDown size={18} className={`cs-select-chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div
          id={listboxId}
          ref={listboxRef}
          role="listbox"
          tabIndex={-1}
          aria-label={ariaLabel || label || placeholder}
          className="cs-select-dropdown"
        >
          {options.map((opt, index) => {
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
                <span>{opt}</span>
                {isSelected && <Check size={16} color="var(--color-coral)" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
