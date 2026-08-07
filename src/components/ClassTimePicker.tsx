import React, { useState, useEffect } from 'react';
import { SimpleSelect } from './SimpleSelect';

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
    let h = parseInt(hStr, 10) + 2;
    let m = parseInt(mStr, 10);
    if (h > 21 || (h === 21 && m > 0)) {
      h = 21;
      m = 0;
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
        <SimpleSelect
          options={timeOptions}
          value={startTime}
          onChange={handleStartTimeChange}
          style={{ flex: 1 }}
        />
        <span style={{ alignSelf: 'center', color: 'var(--color-muted)' }}>-</span>
        <SimpleSelect
          options={timeOptions}
          value={endTime}
          onChange={setEndTime}
          style={{ flex: 1 }}
        />
      </div>
    </div>
  );
};
