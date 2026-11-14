import React, { useState, useEffect, useId } from 'react';
import { SimpleSelect } from './SimpleSelect';

export interface ClassTimePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

export const ClassTimePicker: React.FC<ClassTimePickerProps> = ({
  label,
  value,
  onChange,
  id,
}) => {
  const [dateStr, setDateStr] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [startTime, setStartTime] = useState<string>('10:00');
  const [endTime, setEndTime] = useState<string>('12:00');
  const generatedId = useId();
  const dateInputId = id || `${generatedId}-date`;

  useEffect(() => {
    if (dateStr && startTime && endTime) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);
        const formatted = `${year}年${month}月${day}日 ${startTime}-${endTime}`;
        if (formatted !== value) {
          onChange(formatted);
        }
      }
    }
  }, [dateStr, startTime, endTime, onChange, value]);

  const generateTimeOptions = () => {
    const times: string[] = [];
    for (let i = 8; i <= 21; i++) {
      const hour = i.toString().padStart(2, '0');
      times.push(`${hour}:00`);
      if (i < 21) {
        times.push(`${hour}:30`);
      }
    }
    return times;
  };

  const addTwoHours = (timeStr: string): string => {
    const [hStr, mStr] = timeStr.split(':');
    const h = parseInt(hStr, 10) + 2;
    const m = parseInt(mStr, 10);
    if (h > 21 || (h === 21 && m > 0)) {
      return '21:00';
    }
    const hFormatted = h.toString().padStart(2, '0');
    const mFormatted = m.toString().padStart(2, '0');
    return `${hFormatted}:${mFormatted}`;
  };

  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime);
    const autoEndTime = addTwoHours(newStartTime);
    setEndTime(autoEndTime);
  };

  const timeOptions = generateTimeOptions();

  return (
    <div className="cs-form-group">
      <label htmlFor={dateInputId} className="cs-label">
        {label}
      </label>
      <div className="cs-time-picker-grid">
        <div className="cs-time-picker-date" style={{ width: '100%' }}>
          <input
            id={dateInputId}
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            className="cs-input"
            aria-label="选择上课日期"
            style={{ width: '100%', height: '46px' }}
          />
        </div>
        <div className="cs-time-range-group" style={{ width: '100%' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <SimpleSelect
              options={timeOptions}
              value={startTime}
              onChange={handleStartTimeChange}
              ariaLabel="开始时间"
              placeholder="开始时间"
            />
          </div>
          <span style={{ color: 'var(--color-ink-3)', fontWeight: 500, padding: '0 4px', userSelect: 'none' }} aria-hidden="true">
            —
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <SimpleSelect
              options={timeOptions}
              value={endTime}
              onChange={setEndTime}
              ariaLabel="结束时间"
              placeholder="结束时间"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
