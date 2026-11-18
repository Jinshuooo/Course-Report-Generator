# 提示词与实验记录

## 生效的提示词

应用实际使用的是内联在 `src/lib/deepseek.ts` 里的两份常量，本目录的文件是它们的**可读源文件**：

| 文件 | 对应常量 | 用途 |
| --- | --- | --- |
| `system-v2.md` | `SYSTEM_PROMPT` | 模板反馈（📕 + 编号分点） |
| `plain-feedback.md` | `PLAIN_SYSTEM_PROMPT` | 普通反馈（微信消息式，按课堂顺序一段一件事） |
| `system-v1.md` | — | 历史版本，仅留档对比 |

**改提示词的流程**：改这里的 md → 同步到 `deepseek.ts` → 用 `scripts/prompt-lab.mjs` 跑回归 → 提交。
改完可以用下面的脚本校验两边是否逐字一致：

```bash
node -e "const fs=require('fs');const s=fs.readFileSync('src/lib/deepseek.ts','utf8');
const g=n=>{const i=s.indexOf('export const '+n+' = \`')+('export const '+n+' = \`').length;return s.slice(i,s.indexOf('\`;',i))};
console.log(g('SYSTEM_PROMPT')===fs.readFileSync('prompts/system-v2.md','utf8').trim());"
```

## 实验台

```bash
node scripts/prompt-lab.mjs --env .env.deepseek \
  --label c-v2 --system prompts/system-v2.md \
  --name 梓阳 --input prompts/cases/case-c-exam-analysis.txt \
  --out prompts/runs/c-v2.md
```

- `--name` 模拟 App 的姓名注入指令，`--meta` 模拟【课程信息】块，两者都传才和线上请求一致
- 每次运行的 token 和估算费用追加到 `prompts/runs/cost-log.jsonl`
- 需要 `DEEPSEEK_API_KEY`，放在项目根的 `.env.deepseek`（已被 `.gitignore` 的 `.env.*` 排除）

## 测试案例

- `cases/case-b-english-short.txt`：高中英语短课，材料干净，用来验证科目泛化和篇幅收缩
- `cases/case-c-exam-analysis.txt`：初三化学一模卷分析，用来验证非逐字稿材料的写法

真实的长逐字稿（3 小时理化生连上）没有入库，跑的时候直接指向本地文件即可。

## 已知结论（2026-11 一轮）

- v1 写死"初中物理"，科目/学段一换就跑偏；鼓励"扩展"导致凑字数和空话
- v2 在 3 小时逐字稿上能落到具体题型和错因，且不编造材料外的数字
- 逐字稿里的闲聊、跑题、机构八卦必须显式禁止，否则会被写进反馈
- 没有给出课时长度时，模型会自己编"一节课""两小时"，已加规则堵住
