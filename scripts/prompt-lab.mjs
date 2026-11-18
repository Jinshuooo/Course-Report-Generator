#!/usr/bin/env node
/**
 * 提示词实验台：把同一份课堂材料分别喂给不同版本的 system prompt，
 * 比较输出并统计 token / 费用，方便迭代提示词。
 *
 * 用法：
 *   node scripts/prompt-lab.mjs \
 *     --system prompts/system-v2.md \
 *     --input  prompts/cases/case-b-english-short.txt \
 *     --meta   "科目：高中英语｜学段：高一｜时长：60分钟｜授课形式：一对一｜学生：小陈｜教师：王老师" \
 *     --out    prompts/runs/b-v2.md
 *
 * 需要环境变量 DEEPSEEK_API_KEY（或用 --env 指定文件）。
 */

import { readFile, writeFile, mkdir, appendFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const arg = (name, fallback = '') => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1] ?? fallback;
};
const has = (name) => argv.includes(`--${name}`);

const systemPath = arg('system', 'prompts/system-v2.md');
const inputPath = arg('input');
const outPath = arg('out');
const model = arg('model', 'deepseek-v4-flash');
const temperature = Number(arg('temp', '0.7'));
const meta = arg('meta');
const label = arg('label', path.basename(outPath || 'run').replace(/\.md$/, ''));

if (!inputPath || !outPath) {
  console.error('缺少 --input 或 --out');
  process.exit(1);
}

// 允许用 --env 指定一个 dotenv 文件读取 DEEPSEEK_API_KEY
const envFile = arg('env');
if (envFile && existsSync(envFile)) {
  const raw = await readFile(envFile, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const apiKey = process.env.DEEPSEEK_API_KEY;
if (!apiKey) {
  console.error('没有 DEEPSEEK_API_KEY。请 export 它，或用 --env .env.deepseek 指定文件。');
  process.exit(1);
}

const system = await readFile(systemPath, 'utf8');
const material = await readFile(inputPath, 'utf8');

const studentName = arg('name');

// 与 App 的 user message 拼装保持一致：有姓名时先注入替换指令
const baseContent = meta
  ? `【课程信息】\n${meta}\n\n【课堂材料】\n${material}`
  : `【课堂材料】\n${material}`;

const userContent = studentName
  ? `【重要指令】在以下反馈内容中，所有提到"学生"、"孩子"、"该生"等泛称的地方，必须替换为「${studentName}」。不允许使用任何泛称代替学生名字。\n\n以下是课堂内容摘要：\n${baseContent}`
  : baseContent;

const started = Date.now();
const res = await fetch('https://api.deepseek.com/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userContent },
    ],
    temperature,
    stream: false,
  }),
});

if (!res.ok) {
  const text = await res.text();
  console.error(`API ${res.status}: ${text.slice(0, 500)}`);
  process.exit(1);
}

const data = await res.json();
const output = data.choices?.[0]?.message?.content?.trim() ?? '';
const usage = data.usage ?? {};
const pt = usage.prompt_tokens ?? 0;
const ct = usage.completion_tokens ?? 0;

// DeepSeek 定价（元 / 百万 token），用于估算，仅作参考
const IN_PRICE = 2;
const OUT_PRICE = 8;
const cost = (pt / 1e6) * IN_PRICE + (ct / 1e6) * OUT_PRICE;

await mkdir(path.dirname(outPath), { recursive: true });
await writeFile(outPath, output, 'utf8');

const logPath = 'prompts/runs/cost-log.jsonl';
await mkdir('prompts/runs', { recursive: true });
await appendFile(
  logPath,
  JSON.stringify({
    label,
    system: systemPath,
    input: inputPath,
    model,
    prompt_tokens: pt,
    completion_tokens: ct,
    cost_cny: Number(cost.toFixed(4)),
    seconds: ((Date.now() - started) / 1000).toFixed(1),
    at: new Date().toISOString(),
  }) + '\n',
  'utf8',
);

// 历史累计
let total = 0;
try {
  const lines = (await readFile(logPath, 'utf8')).trim().split('\n').filter(Boolean);
  total = lines.reduce((s, l) => s + (JSON.parse(l).cost_cny || 0), 0);
} catch {}

const bodyChars = output.replace(/\s/g, '').length;
const points = (output.match(/^\s*\d+[.、]/gm) || []).length;

console.log(`── ${label} ──`);
console.log(`文件: ${outPath}`);
console.log(`输出: ${bodyChars} 字 / ${points} 点`);
console.log(`tokens: 输入 ${pt} · 输出 ${ct}`);
console.log(`本次约 ${cost.toFixed(4)} 元 | 累计约 ${total.toFixed(4)} 元`);
