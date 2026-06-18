import React, { useState, useEffect } from 'react';

interface ClassTimePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export const ClassTimePicker: React.FC<ClassTimePickerProps> = ({
  label,
  value,
  onChange,
}) => {
  // Try to parse existing value if present.
  // Format: "2026年6月14日 10:00-12:00"
  const [dateStr, setDateStr] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('10:00');
  const [endTime, setEndTime] = useState<string>('12:00');

  useEffect(() => {
    if (!dateStr) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDateStr(`${yyyy}-${mm}-${dd}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (dateStr && startTime && endTime) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        // e.g., parts = ["2026", "06", "14"]
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
    const times = [];
    for (let i = 6; i <= 23; i++) {
      const hour = i.toString().padStart(2, '0');
      times.push(`${hour}:00`);
      times.push(`${hour}:30`);
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  return (
    <div className="cs-flex-col cs-mb-4">
      <label className="cs-label">{label}</label>
      <div className="cs-flex cs-gap-2">
        <input 
          type="date" 
          value={dateStr}
          onChange={(e) => setDateStr(e.target.value)}
          className="cs-input"
          style={{ flex: 1 }}
        />
        <select 
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="cs-input"
          style={{ flex: 1 }}
        >
          {timeOptions.map(t => <option key={`start-${t}`} value={t}>{t}</option>)}
        </select>
        <span style={{ alignSelf: 'center', color: 'var(--color-muted)' }}>-</span>
        <select 
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="cs-input"
          style={{ flex: 1 }}
        >
          {timeOptions.map(t => <option key={`end-${t}`} value={t}>{t}</option>)}
        </select>
      </div>
    </div>
  );
};
