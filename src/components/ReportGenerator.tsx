import React, { useState, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { streamDeepSeek } from '../lib/deepseek';
import { Play, Copy, Check, AlertCircle, ClipboardList, Sparkles, FileText, Loader2 } from 'lucide-react';
import { DynamicSelect } from './DynamicSelect';
import { SimpleSelect } from './SimpleSelect';
import { ClassTimePicker } from './ClassTimePicker';
import { addUsageRecord } from '../lib/usageTracker';

const getDefaultSendTime = (): string => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return '上午';
  if (hour >= 12 && hour < 18) return '下午';
  return '晚上';
};

export const ReportGenerator: React.FC = () => {
  const { apiKey, user, isGuest } = useAppContext();

  // Form State
  const [studentName, setStudentName] = useState(() => localStorage.getItem('cs_last_student') || '');
  const [sendTime, setSendTime] = useState(getDefaultSendTime);
  const [classTime, setClassTime] = useState('');
  const [subject, setSubject] = useState(() => localStorage.getItem('cs_last_subject') || '');
  const [teacher, setTeacher] = useState(() => localStorage.getItem('cs_last_teacher') || '');
  const [homework, setHomework] = useState('');
  const [contentInput, setContentInput] = useState('');

  const handleStudentChange = (val: string) => {
    setStudentName(val);
    localStorage.setItem('cs_last_student', val);
  };

  const handleSubjectChange = (val: string) => {
    setSubject(val);
    localStorage.setItem('cs_last_subject', val);
  };

  const handleTeacherChange = (val: string) => {
    setTeacher(val);
    localStorage.setItem('cs_last_teacher', val);
  };

  // Generation State
  const [deepseekOutput, setDeepseekOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const outputSectionRef = useRef<HTMLDivElement>(null);

  const getFinalReport = () => {
    if (!deepseekOutput) return '';

    let dsOut = deepseekOutput.trim();

    // Check how many points exist to append homework if applicable.
    if (homework.trim()) {
      let nextNum;
      const matches = dsOut.match(/^(\d+)\./gm);
      if (matches && matches.length > 0) {
        const lastNum = parseInt(matches[matches.length - 1], 10);
        nextNum = lastNum + 1;
      } else {
        // Fallback, see if there's any numbered item
        nextNum = dsOut.split('\n').filter(line => /^\d+\./.test(line)).length + 1;
      }

      // Remove trailing newlines
      dsOut = dsOut.replace(/\n+$/, '');

      // Remove blank lines between numbered items
      dsOut = dsOut.replace(/\n\s*\n/g, '\n');

      dsOut += `\n${nextNum}. 作业：${homework}`;
    } else {
      // Even if no homework, remove blank lines between numbered items
      dsOut = dsOut.replace(/\n\s*\n/g, '\n');
    }

    return `${studentName}家长，${sendTime}好呀
以下是${subject}课堂反馈，请查收～🌸
时间：${classTime}
科目：${subject}
教师：${teacher}

${dsOut}`;
  };

  const handleGenerate = async () => {
    if (!apiKey) {
      setError('请先在顶部设置中配置 DeepSeek API Key');
      return;
    }
    if (!studentName || !subject || !teacher || !classTime) {
      setError('请完整填写学生姓名、上课时间、科目及老师称呼');
      return;
    }
    if (!contentInput.trim()) {
      setError('请提供本次课程的内容摘要');
      return;
    }

    setIsGenerating(true);
    setError('');
    setDeepseekOutput('');

    // On mobile, scroll output card into view
    if (window.innerWidth < 1024 && outputSectionRef.current) {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      outputSectionRef.current.scrollIntoView({
        behavior: prefersReduced ? 'auto' : 'smooth',
        block: 'start',
      });
    }

    try {
      await streamDeepSeek(
        apiKey,
        contentInput,
        (chunk) => {
          setDeepseekOutput((prev) => prev + chunk);
        },
        (promptTokens, completionTokens) => {
          addUsageRecord(promptTokens, completionTokens, user?.id, isGuest);
        },
        studentName
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '生成过程中发生错误');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    const textToCopy = getFinalReport();
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <>
      <div className="cs-workspace-grid cs-main-pad-bottom">
        {/* Left Column (7 cols): Input Form */}
        <div className="cs-col-form cs-card cs-rise-in">
          {/* Card Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '16px', marginBottom: '20px', borderBottom: '1px solid var(--color-hairline)' }}>
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
              <ClipboardList size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--color-ink)' }}>填写课程信息</h2>
            </div>
          </div>

          {/* Form Body */}
          <div>
            {/* Row 1: Student name & send time */}
            <div className="cs-form-row-2">
              <DynamicSelect
                label="学生姓名"
                storageKey="cs_student_names"
                value={studentName}
                onChange={handleStudentChange}
                placeholder="选择或输入添加学生"
              />
              <SimpleSelect
                label="反馈发送时间"
                options={['上午', '下午', '晚上']}
                value={sendTime}
                onChange={setSendTime}
              />
            </div>

            {/* Row 2: Class time */}
            <ClassTimePicker
              label="上课时间"
              value={classTime}
              onChange={setClassTime}
            />

            {/* Row 3: Subject & teacher */}
            <div className="cs-form-row-2">
              <DynamicSelect
                label="科目"
                storageKey="cs_subjects"
                value={subject}
                onChange={handleSubjectChange}
                placeholder="选择或输入科目 (如物理)"
              />
              <DynamicSelect
                label="老师称呼"
                storageKey="cs_teachers"
                value={teacher}
                onChange={handleTeacherChange}
                placeholder="选择或输入称呼 (如江老师)"
              />
            </div>

            {/* Row 4: Homework */}
            <div className="cs-form-group">
              <label htmlFor="homework-input" className="cs-label">
                课后作业
              </label>
              <input
                id="homework-input"
                type="text"
                value={homework}
                onChange={(e) => setHomework(e.target.value)}
                placeholder="选填，例如：完成中考物理模拟卷第1-15题"
                className="cs-input"
              />
            </div>

            {/* Row 5: Content Summary */}
            <div className="cs-form-group" style={{ marginBottom: '8px' }}>
              <label htmlFor="content-input" className="cs-label">
                上课内容摘要
              </label>
              <textarea
                id="content-input"
                value={contentInput}
                onChange={(e) => setContentInput(e.target.value)}
                placeholder="粘贴课堂板书要点、录音转文字笔记或要点摘要..."
                className="cs-input"
                rows={5}
              />
            </div>
          </div>

          {/* Inline Error (Desktop only) */}
          {error && (
            <div
              role="alert"
              className="cs-desktop-only-error"
              style={{
                marginTop: '16px',
                padding: '12px 14px',
                backgroundColor: 'var(--color-error-soft)',
                border: '1px solid rgba(184, 67, 58, 0.2)',
                borderRadius: 'var(--radius-control)',
                color: 'var(--color-error)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Desktop Generate Button */}
          <div
            className="cs-desktop-only-btn"
            style={{
              paddingTop: '20px',
              marginTop: '16px',
              borderTop: '1px solid var(--color-hairline)',
            }}
          >
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !contentInput.trim()}
              aria-busy={isGenerating}
              className="cs-btn"
              style={{ width: '100%', height: '48px' }}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={18} className="cs-spinning" />
                  <span>正在生成课堂报告...</span>
                </>
              ) : (
                <>
                  <Play size={18} fill="currentColor" />
                  <span>生成课堂报告</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column (5 cols): Sticky Paper Output */}
        <div
          ref={outputSectionRef}
          className="cs-col-output cs-card-output cs-rise-in-delay-1"
          style={{ scrollMarginTop: 'calc(var(--header-height) + 16px)' }}
        >
          {/* Output Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid var(--color-hairline)',
              backgroundColor: 'var(--color-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  backgroundColor: 'var(--color-coral-soft)',
                  color: 'var(--color-coral)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={16} />
              </div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-ink)' }}>课堂反馈</h2>
            </div>

            {deepseekOutput && !isGenerating && (
              <button
                type="button"
                onClick={handleCopy}
                className="cs-btn cs-btn-secondary"
                aria-label={copied ? '已复制到剪贴板' : '复制反馈文本'}
                style={{
                  height: '42px',
                  padding: '0 14px',
                  fontSize: '14px',
                }}
              >
                {copied ? (
                  <>
                    <Check size={15} color="var(--color-success)" />
                    <span style={{ color: 'var(--color-success)', fontWeight: 600 }} aria-live="polite">已复制</span>
                  </>
                ) : (
                  <>
                    <Copy size={15} />
                    <span>复制文本</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Report Paper Surface */}
          <div className="cs-output-content-wrap">
            {deepseekOutput ? (
              <div className="cs-report-serif">
                {getFinalReport()}
                {isGenerating && <span className="cs-caret" aria-hidden="true" />}
              </div>
            ) : isGenerating ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '220px', color: 'var(--color-ink-2)' }}>
                <Loader2 size={28} className="cs-spinning" style={{ color: 'var(--color-coral)', marginBottom: '12px' }} />
                <p style={{ fontSize: '14px', margin: 0 }}>正在提炼要点并撰写反馈...</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '220px', textAlign: 'center', color: 'var(--color-ink-3)' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-coral-soft)',
                    color: 'var(--color-coral)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px',
                  }}
                >
                  <FileText size={22} />
                </div>
                <p style={{ fontSize: '14px', margin: 0, color: 'var(--color-ink-2)' }}>
                  生成的反馈报告将呈现在这里
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="cs-mobile-action-bar">
        {error && (
          <div
            role="alert"
            style={{
              marginBottom: '10px',
              padding: '8px 12px',
              backgroundColor: 'var(--color-error-soft)',
              borderRadius: 'var(--radius-control)',
              color: 'var(--color-error)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || !contentInput.trim()}
          aria-busy={isGenerating}
          className="cs-btn"
          style={{ width: '100%', height: '48px' }}
        >
          {isGenerating ? (
            <>
              <Loader2 size={18} className="cs-spinning" />
              <span>正在生成...</span>
            </>
          ) : (
            <>
              <Play size={18} fill="currentColor" />
              <span>生成课堂报告</span>
            </>
          )}
        </button>
      </div>
    </>
  );
};
