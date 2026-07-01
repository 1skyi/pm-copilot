# CODEX.md —— 你的工作区

## 你可以改的文件
```
src/prompts/*.ts              ← 所有 Prompt（review, coach, optimizer 等）
src/components/coach/*.tsx    ← Coach 面板
src/components/markdown/*.tsx ← Result 区域
src/components/workspace/*.tsx ← 工作区 + 版本时间线
src/constants/index.ts        ← UI 文案
```

## 你绝对不能碰的文件
```
src/app/page.tsx              ← 状态管理（CC 负责）
src/lib/ai/coordinator.ts     ← 执行引擎（CC 负责）
src/lib/ai/version-manager.ts ← 版本数据层（CC 负责）
src/types/index.ts            ← 类型定义（CC 负责，需要新增类型时告诉 CC）
```

## 工作流
```
1. 读 CLAUDE.md 了解项目架构
2. 只在你的文件范围内修改
3. 改完告诉我 "改好了"（不要自己 commit）
4. CC Review 后会处理 commit / push / deploy
```

## 当前架构速览
```
用户输入 Idea
  ↓
Version(n) 生成（9 步 Workflow）
  ↓
Review Agent → JSON {score, maturity, issues[]}
  ↓
Coach Agent → {topIssues, coachAdvice}
  ↓
Version(n) 存储（不可变快照）
  ↓
用户点 Optimize → Optimizer Agent → Version(n+1)
```

## 核心原则
- 每一次迭代都必须比上一轮更聚焦、更具体、更接近 MVP
- 优化只修复 Review 指出的问题，不能加新功能
- 所有版本永久保留，不可覆盖
