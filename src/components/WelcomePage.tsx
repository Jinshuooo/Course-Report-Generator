import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { AuthModal } from './AuthModal';

/**
 * 欢迎页动效取自「介绍页三段动效」的设计语言：
 * ① 标题逐字入场：遮罩内 yPercent 118 → 0，0.85s power3.out，22ms 错峰
 * ② 滚动分镜：卡片随滚动在三屏之间交叉淡入（0.45s），并轻微缩放下沉
 * ③ 磁吸按钮：指针靠近时按钮跟手位移，离开回弹
 * 减弱动效时全部降级为直接呈现。
 */

const HEADLINE = '一节课的记录，写成一条能发出去的反馈';
const STAGGER_MS = 22;

const STEPS = [
  {
    title: '贴进原始记录',
    body: '录音逐字稿、随堂要点、试卷分析都行，格式不限，错别字也不用管。',
  },
  {
    title: '只留下学科内容',
    body: '闲聊、跑题、走神、机构八卦全部剔除，转写错误按上下文纠正，只留知识点和掌握程度。',
  },
  {
    title: '成稿直接可用',
    body: '模板反馈分点成文，普通反馈就是一条能直接发给家长的微信消息。',
  },
];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(prefersReducedMotion);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  return reduced;
};

/** 磁吸按钮：指针在按钮附近时跟手，离开归零 */
const useMagnetic = (enabled: boolean) => {
  const ref = useRef<HTMLButtonElement>(null);
  const frame = useRef<number | null>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    const render = () => {
      current.current.x += (target.current.x - current.current.x) * 0.18;
      current.current.y += (target.current.y - current.current.y) * 0.18;
      el.style.transform = `translate3d(${current.current.x.toFixed(2)}px, ${current.current.y.toFixed(2)}px, 0)`;

      const settled =
        Math.abs(target.current.x - current.current.x) < 0.1 &&
        Math.abs(target.current.y - current.current.y) < 0.1;

      frame.current = settled ? null : requestAnimationFrame(render);
    };

    const start = () => {
      if (frame.current === null) frame.current = requestAnimationFrame(render);
    };

    const handleMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      const radius = Math.max(rect.width, rect.height) * 0.9;

      if (Math.hypot(dx, dy) > radius) {
        target.current = { x: 0, y: 0 };
      } else {
        target.current = { x: dx * 0.22, y: dy * 0.28 };
      }
      start();
    };

    const handleLeave = () => {
      target.current = { x: 0, y: 0 };
      start();
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerleave', handleLeave);
    el.addEventListener('pointerleave', handleLeave);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerleave', handleLeave);
      el.removeEventListener('pointerleave', handleLeave);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [enabled]);

  return ref;
};

export const WelcomePage: React.FC = () => {
  const { setIsGuest } = useAppContext();
  const [showAuth, setShowAuth] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const magneticRef = useMagnetic(!reduced);

  // ② 滚动分镜进度
  useEffect(() => {
    if (reduced) return;

    let frame: number | null = null;

    const update = () => {
      frame = null;
      const stage = stageRef.current;
      if (!stage) return;

      const rect = stage.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      if (travel <= 0) return;

      const progress = Math.min(1, Math.max(0, -rect.top / travel));
      const next = Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length));
      setActiveStep((prev) => (prev === next ? prev : next));
    };

    const onScroll = () => {
      if (frame === null) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [reduced]);

  const handleGuest = useCallback(() => {
    setIsGuest(true);
  }, [setIsGuest]);

  if (showAuth) {
    // 复用现有登录页，避免两套入口
    return <AuthModal />;
  }

  return (
    <div className="cs-welcome">
      <div className="cs-welcome-inner">
        <div className="cs-welcome-hero">
          <p className="cs-welcome-eyebrow">
            <Sparkles size={14} aria-hidden="true" />
            课堂反馈系统 · K12 课后反馈
          </p>

          <h1 className="cs-welcome-title" aria-label={HEADLINE}>
            {HEADLINE.split('').map((char, index) => (
              <span className="cs-welcome-mask" key={`${char}-${index}`} aria-hidden="true">
                <span
                  className="cs-welcome-char"
                  style={{ animationDelay: `${index * STAGGER_MS}ms` }}
                >
                  {char}
                </span>
              </span>
            ))}
          </h1>

          <p className="cs-welcome-sub cs-welcome-rise" style={{ animationDelay: '520ms' }}>
            粘贴课堂要点或录音逐字稿，选「模板反馈」或「普通反馈」，几十秒出一份像老师本人写的成稿。
          </p>

          <div className="cs-welcome-actions cs-welcome-rise" style={{ animationDelay: '640ms' }}>
            <button
              ref={magneticRef}
              type="button"
              className="cs-btn cs-welcome-cta"
              onClick={() => setShowAuth(true)}
            >
              开始使用
              <ArrowRight size={18} aria-hidden="true" />
            </button>
            <button type="button" className="cs-btn cs-btn-secondary" onClick={handleGuest}>
              先试用一下
            </button>
          </div>
        </div>
      </div>

      <div className="cs-welcome-stage" ref={stageRef}>
        <div className="cs-welcome-stage-inner">
          <div className="cs-welcome-steps">
            {STEPS.map((step, index) => (
              <div
                key={step.title}
                className={`cs-welcome-step${index === activeStep ? ' is-active' : ''}`}
              >
                <span className="cs-welcome-step-index">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h2 className="cs-welcome-step-title">{step.title}</h2>
                  <p className="cs-welcome-step-body">{step.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="cs-welcome-card" data-step={activeStep}>
            <div className={`cs-welcome-screens${reduced ? ' is-reduced' : ''}`}>
              <div className={`cs-welcome-screen${activeStep === 0 ? ' is-active' : ''}`}>
                <p className="cs-welcome-raw">
                  发言人2(00:03:52): 你现在讲到欧姆定律了吗？<br />
                  发言人1(00:04:33): 我们就第一章开始学了，我不知道学没学公式<br />
                  发言人1(00:51:11): 你小米10？老师你玩什么游戏啊<br />
                  发言人2(01:41:01): 这个氮是不是正五？
                </p>
              </div>

              <div className={`cs-welcome-screen${activeStep === 1 ? ' is-active' : ''}`}>
                <ul className="cs-welcome-points">
                  <li>电学画图：串联电路、电压表并联位置</li>
                  <li>滑动变阻器：滑片方向与阻值变化</li>
                  <li>化合价：常见原子团、离子符号写法</li>
                </ul>
                <p className="cs-welcome-strike">游戏、手机、机构闲谈 · 已剔除</p>
              </div>

              <div className={`cs-welcome-screen${activeStep === 2 ? ' is-active' : ''}`}>
                <p className="cs-welcome-report-head">📕【学习情况及复习建议】</p>
                <p className="cs-welcome-report-body">
                  1. 这次课主要过了电学画图和化合价两块内容。
                  <br />
                  2. 电路图与实物图互画基本能独立完成；滑动变阻器的接法还容易反，换个图就要重新想。
                  <br />
                  3. 常见原子团化合价记不牢，镁离子和镁元素的写法容易混。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="cs-welcome-foot">
        <span>深浅色随系统</span>
        <span aria-hidden="true">·</span>
        <span>支持手机端</span>
        <span aria-hidden="true">·</span>
        <span>数据只在你的账号里</span>
      </div>
    </div>
  );
};
