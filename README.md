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

## 许可证

MIT
