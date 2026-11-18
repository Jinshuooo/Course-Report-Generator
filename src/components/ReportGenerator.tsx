import React, { useState, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { streamDeepSeek, type ReportMode } from '../lib/deepseek';
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

interface ReportMeta {
  label: string;
  value: string;
}

type ReportBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'item'; number: string; text: string }
  | { kind: 'paragraph'; text: string };

interface ParsedReport {
  greeting: string;
  intro: string;
  meta: ReportMeta[];
  blocks: ReportBlock[];
}

const META_LINE = /^(时间|科目|教师)[：:]\s*(.*)$/;

/**
 * Turns the plain-text report into display blocks without changing the
 * clipboard payload. getFinalReport() stays the single source of truth.
 */
const parseReportForDisplay = (report: string, mode: ReportMode): ParsedReport => {
  const lines = report.split('\n');

  if (mode === 'plain') {
    const nonEmpty = lines.map((line) => line.trim()).filter(Boolean);
    return {
      greeting: nonEmpty[0] ?? '',
      intro: '',
      meta: [],
      blocks: nonEmpty
        .slice(1)
        .map((text): ReportBlock => ({ kind: 'paragraph', text })),
    };
  }

  const metaStart = lines.findIndex((line) => META_LINE.test(line.trim()));

  const meta: ReportMeta[] = [];
  let metaEnd = metaStart;

  if (metaStart !== -1) {
    let index = metaStart;
    while (index < lines.length) {
      const trimmed = lines[index].trim();
      const match = trimmed.match(META_LINE);
      if (match) {
        meta.push({ label: match[1], value: match[2] });
      } else if (trimmed !== '') {
        break;
      }
      metaEnd = index;
      index += 1;
    }
  }

  const headEnd = metaStart === -1 ? Math.min(2, lines.length) : metaStart;
  const headLines = lines.slice(0, headEnd);
  const bodyLines = metaStart === -1 ? lines.slice(headEnd) : lines.slice(metaEnd + 1);

  const blocks: ReportBlock[] = [];

  bodyLines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) return;

    const itemMatch = line.match(/^(\d+)[.、]\s*(.*)$/);
    if (itemMatch) {
      blocks.push({ kind: 'item', number: itemMatch[1], text: itemMatch[2] });
      return;
    }

    if (line.startsWith('📕') || /^【[^】]+】/.test(line)) {
      blocks.push({ kind: 'heading', text: line });
      return;
    }

    blocks.push({ kind: 'paragraph', text: line });
  });

  return {
    greeting: headLines[0] ?? '',
    intro: headLines.slice(1).join(' ').trim(),
    meta,
    blocks,
  };
};

export const ReportGenerator: React.FC = () => {
  const { apiKey, user, isGuest } = useAppContext();

  // Form State
  const [reportMode, setReportMode] = useState<ReportMode>(() =>
    localStorage.getItem('cs_last_mode') === 'plain' ? 'plain' : 'template'
  );
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

  const handleModeChange = (mode: ReportMode) => {
    if (mode === reportMode) return;
    setReportMode(mode);
    localStorage.setItem('cs_last_mode', mode);
    // The rendered output belongs to the mode it was generated in.
    setDeepseekOutput('');
    setError('');
    setCopied(false);
  };

  const getFinalReport = () => {
    if (!deepseekOutput) return '';

    if (reportMode === 'plain') {
      const dsOut = deepseekOutput.trim();
      if (!dsOut) return '';
      return homework.trim()
        ? `${dsOut}\n\n本次布置的作业：${homework.trim()}`
        : dsOut;
    }

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
    if (reportMode === 'plain') {
      if (!studentName || !contentInput.trim()) {
        setError('请填写学生姓名及上课内容摘要');
        return;
      }
    } else {
      if (!studentName || !subject || !teacher || !classTime) {
        setError('请完整填写学生姓名、上课时间、科目及老师称呼');
        return;
      }
      if (!contentInput.trim()) {
        setError('请提供本次课程的内容摘要');
        return;
      }
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
        studentName,
        reportMode
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

  const parsedReport = deepseekOutput
    ? parseReportForDisplay(getFinalReport(), reportMode)
    : null;

  return (
    <>
      <div className="cs-workspace-grid cs-main-pad-bottom">
        {/* Left Column (7 cols): Input Form */}
        <section
          className="cs-col-form cs-card cs-enter cs-enter-delay-1"
          aria-labelledby="form-card-title"
        >
          {/* Card Header */}
          <div className="cs-card-head">
            <span className="cs-icon-tile" aria-hidden="true">
              <ClipboardList size={20} />
            </span>
            <h2 id="form-card-title" className="cs-section-title">填写课程信息</h2>
          </div>

          {/* Form Body */}
          <div className="cs-form-stagger">
            {/* Row 0: Report mode */}
            <div className="cs-mode-field">
              <div
                className="cs-mode-switch"
                role="group"
                aria-label="反馈模式"
              >
                <button
                  type="button"
                  className="cs-mode-option"
                  aria-pressed={reportMode === 'template'}
                  disabled={isGenerating}
                  onClick={() => handleModeChange('template')}
                >
                  模板反馈
                </button>
                <button
                  type="button"
                  className="cs-mode-option"
                  aria-pressed={reportMode === 'plain'}
                  disabled={isGenerating}
                  onClick={() => handleModeChange('plain')}
                >
                  普通反馈
                </button>
              </div>
              <p className="cs-mode-hint">
                模板反馈：分点课后反馈；普通反馈：像微信消息，按课堂顺序叙述
              </p>
            </div>

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
            <div className="cs-form-group">
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
            <div role="alert" className="cs-alert cs-alert-error cs-form-error cs-desktop-only-error">
              <AlertCircle size={16} className="cs-alert-icon" />
              <span>{error}</span>
            </div>
          )}

          {/* Desktop Generate Button */}
          <div className="cs-desktop-only-btn cs-form-actions">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !contentInput.trim()}
              aria-busy={isGenerating}
              className="cs-btn cs-btn-block"
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
        </section>

        {/* Right Column (5 cols): Sticky Paper Output */}
        <section
          ref={outputSectionRef}
          className="cs-col-output cs-card-output cs-enter cs-enter-delay-2"
          aria-labelledby="output-card-title"
        >
          {/* Output Header */}
          <div className="cs-output-head">
            <div className="cs-output-heading">
              <span className="cs-icon-tile cs-icon-tile-sm" aria-hidden="true">
                <Sparkles size={16} />
              </span>
              <h2 id="output-card-title" className="cs-section-title">课堂反馈</h2>
            </div>

            {deepseekOutput && !isGenerating && (
              <button
                type="button"
                onClick={handleCopy}
                className={`cs-btn cs-btn-secondary cs-btn-sm ${copied ? 'cs-btn-success' : ''}`}
                aria-label={copied ? '已复制到剪贴板' : '复制反馈文本'}
              >
                {copied ? (
                  <>
                    <Check size={16} className="cs-pop" />
                    <span aria-live="polite">已复制</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>复制文本</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Report Paper Surface */}
          <div className="cs-output-content-wrap cs-output-paper">
            {parsedReport ? (
              <article className="cs-report cs-state-in" aria-busy={isGenerating}>
                <header className="cs-report-letterhead">
                  <p className="cs-report-greeting">{parsedReport.greeting}</p>
                  {parsedReport.intro && (
                    <p className="cs-report-intro">{parsedReport.intro}</p>
                  )}
                  {parsedReport.meta.length > 0 && (
                    <dl className="cs-report-meta">
                      {parsedReport.meta.map((item) => (
                        <div className="cs-report-meta-row" key={item.label}>
                          <dt>{item.label}</dt>
                          <dd>{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </header>

                <div className="cs-report-body">
                  {parsedReport.blocks.length === 0 && isGenerating && (
                    <p className="cs-report-paragraph">
                      <span className="cs-caret" aria-hidden="true" />
                    </p>
                  )}
                  {parsedReport.blocks.map((block, index) => {
                    const caret =
                      isGenerating && index === parsedReport.blocks.length - 1 ? (
                        <span className="cs-caret" aria-hidden="true" />
                      ) : null;

                    if (block.kind === 'heading') {
                      return (
                        <h3 className="cs-report-heading" key={index}>
                          {block.text}
                          {caret}
                        </h3>
                      );
                    }

                    if (block.kind === 'item') {
                      return (
                        <p className="cs-report-item" key={index}>
                          <span className="cs-report-num">{block.number}.</span>
                          <span className="cs-report-text">
                            {block.text}
                            {caret}
                          </span>
                        </p>
                      );
                    }

                    return (
                      <p className="cs-report-paragraph" key={index}>
                        <span className="cs-report-text">
                          {block.text}
                          {caret}
                        </span>
                      </p>
                    );
                  })}
                </div>
              </article>
            ) : isGenerating ? (
              <div className="cs-empty-state cs-state-in">
                <Loader2 size={28} className="cs-spinning" aria-hidden="true" />
                <p>正在提炼要点并撰写反馈...</p>
              </div>
            ) : (
              <div className="cs-empty-state cs-state-in">
                <span className="cs-empty-icon" aria-hidden="true">
                  <FileText size={22} />
                </span>
                <p>生成的反馈报告将呈现在这里</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="cs-mobile-action-bar">
        {error && (
          <div role="alert" className="cs-alert cs-alert-error cs-mobile-error">
            <AlertCircle size={14} className="cs-alert-icon" />
            <span>{error}</span>
          </div>
        )}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || !contentInput.trim()}
          aria-busy={isGenerating}
          className="cs-btn cs-btn-block"
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
