import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { streamDeepSeek } from '../lib/deepseek';
import { Play, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { DynamicSelect } from './DynamicSelect';
import { ClassTimePicker } from './ClassTimePicker';
import { addUsageRecord } from '../lib/usageTracker';

export const ReportGenerator: React.FC = () => {
  const { apiKey, user, isGuest } = useAppContext();
  
  // Form State
  const [studentName, setStudentName] = useState('');
  const [sendTime, setSendTime] = useState('下午');
  const [classTime, setClassTime] = useState('');
  const [subject, setSubject] = useState('');
  const [teacher, setTeacher] = useState('');
  const [homework, setHomework] = useState('');
  const [contentInput, setContentInput] = useState('');
  
  // Generation State
  const [deepseekOutput, setDeepseekOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

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
      setError('请先配置 DeepSeek API Key');
      return;
    }
    if (!contentInput.trim()) {
      setError('请提供上课内容摘要');
      return;
    }
    if (!studentName || !subject || !teacher || !classTime) {
      setError('请完整填写表单选项');
      return;
    }

    setIsGenerating(true);
    setError('');
    setDeepseekOutput('');

    try {
      await streamDeepSeek(apiKey, contentInput, (chunk) => {
        setDeepseekOutput((prev) => prev + chunk);
      }, (promptTokens, completionTokens) => {
        addUsageRecord(promptTokens, completionTokens, user?.id, isGuest);
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '生成过程中发生错误');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getFinalReport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="cs-grid-2">
      {/* Left Column - Form */}
      <div className="cs-card cs-flex-col">
        <div className="cs-header">
          <h2 className="cs-title">📝 填写课程信息</h2>
        </div>
        
        <div className="cs-flex-col" style={{ flex: 1, overflowY: 'auto' }}>
          <div className="cs-grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
            <DynamicSelect
              label="1. 学生姓名"
              storageKey="cs_student_names"
              value={studentName}
              onChange={setStudentName}
              placeholder="添加或选择学生"
            />
            
            <div className="cs-flex-col cs-mb-4">
              <label className="cs-label">2. 反馈发送时间</label>
              <select 
                className="cs-input" 
                value={sendTime}
                onChange={(e) => setSendTime(e.target.value)}
              >
                <option value="上午">上午</option>
                <option value="下午">下午</option>
                <option value="晚上">晚上</option>
              </select>
            </div>
          </div>

          <ClassTimePicker
            label="3. 上课时间"
            value={classTime}
            onChange={setClassTime}
          />

          <div className="cs-grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
            <DynamicSelect
              label="4. 科目"
              storageKey="cs_subjects"
              value={subject}
              onChange={setSubject}
              placeholder="如：物理"
            />
            
            <DynamicSelect
              label="5. 老师称呼"
              storageKey="cs_teachers"
              value={teacher}
              onChange={setTeacher}
              placeholder="如：江老师"
            />
          </div>

          <div className="cs-flex-col cs-mb-4">
            <label className="cs-label">6. 课后作业</label>
            <input
              type="text"
              value={homework}
              onChange={(e) => setHomework(e.target.value)}
              placeholder="例如：2025年中考卷"
              className="cs-input"
            />
          </div>

          <div className="cs-flex-col cs-mb-4" style={{ flex: 1 }}>
            <label className="cs-label">7. 上课内容摘要</label>
            <textarea
              value={contentInput}
              onChange={(e) => setContentInput(e.target.value)}
              placeholder="输入上课知识点或课堂录音转文字内容..."
              className="cs-input"
              style={{ minHeight: '120px', resize: 'vertical' }}
            />
          </div>
        </div>

        <div className="cs-mt-4" style={{ paddingTop: '1rem', borderTop: '1px solid rgba(55, 53, 47, 0.09)' }}>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !contentInput.trim()}
            className="cs-btn"
            style={{ width: '100%' }}
          >
            {isGenerating ? (
              <span>正在生成中...</span>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                生成课堂报告
              </>
            )}
          </button>
          {error && (
            <div className="cs-mt-4" style={{ color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} />
              <span style={{ fontSize: '0.9rem' }}>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Output Preview */}
      <div className="cs-card cs-flex-col" style={{ position: 'relative' }}>
        <div className="cs-header cs-flex cs-items-center cs-justify-between">
          <h2 className="cs-title">✨ 最终课堂反馈</h2>
          {deepseekOutput && (
            <button
              onClick={handleCopy}
              className="cs-btn cs-btn-secondary"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}
            >
              {copied ? (
                <><CheckCircle2 size={16} color="var(--color-primary)" /> 已复制</>
              ) : (
                <><Copy size={16} /> 复制文本</>
              )}
            </button>
          )}
        </div>
        <div className="cs-flex-col" style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid rgba(55, 53, 47, 0.09)' }}>
          {deepseekOutput ? (
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
              {getFinalReport()}
            </div>
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}>
              <span style={{ fontSize: '2rem', marginBottom: '1rem' }}>📝</span>
              <p>生成的报告将在这里显示</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
