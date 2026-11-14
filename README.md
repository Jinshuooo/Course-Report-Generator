# 课堂反馈报告生成器

一键将简略课堂随笔转化为专业、详细的家长反馈报告。

## 功能

- **AI 生成课堂反馈**：基于 DeepSeek 大模型，输入课堂摘要即可生成适合发送给家长的专业反馈
- **多端数据同步**：登录账号后，学生姓名、科目、老师称呼等选项自动跨设备同步
- **游客模式**：无需注册即可使用，数据保存在本地浏览器
- **API 用量统计**：实时追踪 Token 消耗和预估费用

## 技术栈

- React 19 + TypeScript
- Vite 8
- Supabase（认证 + 云数据库）
- DeepSeek API（AI 文本生成）

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/YOUR_USERNAME/course-report-generator.git
cd course-report-generator
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`，填入你的 Supabase 凭据：

```
VITE_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. 初始化数据库

前往 Supabase 控制台 → SQL Editor，执行 `database.sql` 中的全部语句以创建所需数据表。

### 4. 启动开发服务器

```bash
npm run dev
```

## 构建部署

```bash
npm run build
npm run preview
```

## Supabase 保活（免费版防暂停）

Supabase 免费版项目在连续 7 天没有数据库活动后会被自动暂停，需要手动恢复。本仓库内置了一个 GitHub Actions 定时任务，每天向 Supabase REST API 发起一次真实查询，让项目保持活跃。

### 配置

1. 打开仓库 **Settings → Secrets and variables → Actions**，添加两个 Repository secret：
   - `SUPABASE_URL`：与 `.env.local` 中的 `VITE_SUPABASE_URL` 相同
   - `SUPABASE_ANON_KEY`：与 `.env.local` 中的 `VITE_SUPABASE_ANON_KEY` 相同
2. 确保 **Actions** 已启用（打开 Actions 标签页，如有提示点击启用工作流）。
3. 手动运行一次验证：**Actions → Supabase Keep Alive → Run workflow**。

### 说明

- 工作流位于 `.github/workflows/supabase-keepalive.yml`，每天 UTC 02:17（北京时间 10:17）执行一次。
- 公开仓库连续 60 天没有任何提交时，GitHub 会自动停用定时工作流。因此该工作流每月 1 日会向 `.github/keepalive.txt` 提交一次心跳。若推送失败，请在 **Settings → Actions → General → Workflow permissions** 中选择 “Read and write permissions”，或确认 `main` 分支没有阻止 GitHub Actions 推送的保护规则。
- 本地验证：`npm run keepalive`（读取 `.env.local`）。如果本地网络无法直连 Supabase（例如国内网络环境），可能报 `fetch failed`，此时请以 GitHub Actions 的运行结果为准。
- 如果项目已经被暂停，请先到 Supabase 控制台手动恢复，之后保活任务会自动接管。

## 许可证

MIT
