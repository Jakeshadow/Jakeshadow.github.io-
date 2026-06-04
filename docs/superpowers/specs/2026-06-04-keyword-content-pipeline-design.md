# Keyword Content Pipeline — Design Spec

**Date:** 2026-06-04 | **Status:** Approved

## Problem Statement

当前 hotpage-builder 的内容调研和页面构建在同一个 Claude Code 会话中完成，但内容调研需要访问外网搜索 10+ 来源——Claude Code（国内环境）做这件事受限。需要一个分离的流程：在国外部署的 OpenClaw 负责内容调研和文档生成，Claude Code 负责审核编辑和建站部署。

## Proposed Solution

两段式内容管线：

```
[OpenClaw 端]                     [飞书]              [Claude Code 端]
关键词输入                                             审核 + 修改 MD 文档
  ↓                                                       ↓
深度调研 (10+ sources)                                  用 hotpage-builder 建站
  ↓                                                       ↓
按模板生成 MD 文档                                      部署到 Cloudflare Pages
  ↓
飞书发送 MD 文档 ──────────→ 用户收到
                             用户复制内容
                             ──────────→ 喂给 Claude Code
```

### 角色分工

| 角色 | 工具 | 职责 |
|------|------|------|
| 内容研究员 | OpenClaw (国外) | 搜索 10+ 来源、交叉验证、按模板生成内容文档 |
| 编辑 + 建站 | Claude Code (国内) | 审核内容、修改 MD、用 webpage-builder / hotpage-builder 建站部署 |

### 交付方式

- OpenClaw 生成 MD 文档后 → **通过飞书直接发送给用户**
- 用户收到飞书消息 → 复制内容 → 粘贴给 Claude Code
- Claude Code 审核修改后 → 保存到本地 `docs/content/<slug>-content.md`
- OpenClaw Prompt 模板存放于 Claude Code 本地：`docs/content/openclaw-prompt-template.md`（用户通过飞书发送给 OpenClaw 配置）

## Content Document Template

OpenClaw 输出统一使用以下 Markdown 模板：

```markdown
# Content Doc: [Primary Keyword]

## Meta
- **Primary keyword:**
- **Slug:**
- **Meta title (50–60 chars):**
- **Meta description (140–160 chars):**
- **LSI terms:** [5–8 semantically related terms]
- **Target audience:** [one sentence]

## Pain Points (用户信号)
- **Source:** [Reddit / HN / SO / YouTube comments / search queries — 附链接]
- **Pain 1 (断层/抱怨/困惑):** [描述 + 信号来源]
- **Pain 2:**
- **Pain 3:**

## Module 1: What Is [Keyword]
[One-sentence plain-language explanation]
[2–3 sentences expanding]

## Module 2: Why [Keyword] Matters
[Value proposition — anchored to Pain Point signals]
[2–3 concrete reasons, each 2–3 sentences]

## Module 3: How To [Use / Set Up / Get Started with] [Keyword]
[Step-by-step, actionable]
[3–5 steps, each with explanation]

## Module 4: Key Features
[4–6 features, each 1–2 sentences]

## Module 5: Use Cases
[3–4 use cases, each 2–3 sentences]

## Module 6: FAQ
[5–7 questions derived from user signals]
- **Q:**
  **A:**
```

### 模板规则

- Meta 区域固定在最前，方便 Claude Code 建站时直接提取 title/description/keywords
- Pain Points 为必填项——缺用户信号的文档不合格
- 6 模块顺序与 hotpage-builder 的 `<section>` 顺序 1:1 对应
- LSI terms 从调研来源自然提取，不硬凑密度

## Research Protocol (深度调研规范)

### 信息源分级

| 级别 | 来源类型 | 可信度 | 用途 |
|------|---------|--------|------|
| **A 级** | 官方文档、项目 README、论文原文 | 最高 | 技术定义、API 参数、版本号等硬事实 |
| **B 级** | 权威技术博客、知名社区高赞回答（Reddit/HN/StackOverflow 高票） | 高 | 使用场景、对比分析、实践经验 |
| **C 级** | 竞品 SEO 页面、Medium/Dev.to 文章 | 参考 | 了解已有内容覆盖了什么、找出信息缺口 |

### 交叉验证步骤

每个关键信息点执行三步：

1. 在至少 2 个 A 级来源中找到一致答案 → 确认为"硬事实"
2. 如只找到 1 个 A 级或 A 级互相矛盾 → 用 B 级来源补验，标注为"高置信"
3. 如 B 级也没有一致结论 → 标记为"未充分验证"，不写进文档，或写为"社区普遍认为..."

核心原则：找不到第二个独立来源验证的信息，宁可少写不瞎写。

### 痛点驱动校验（替代差异化为空校验）

不做"竞品没写所以我来写"的信息缺口填空。内容价值建立在**用户正在寻找答案的问题**上。

**信号来源按权重排序：**

| 优先级 | 信号源 | 具体做法 |
|--------|--------|---------|
| **P0** | 竞品页评论区 | 翻 Reddit 贴、HN 讨论、YouTube 评论、竞品页底部 Disqus |
| **P0** | 关键词长尾变体 | "keyword + vs"、"keyword + not working"、"keyword + alternative"、"is keyword worth it" |
| **P1** | 社区帖高赞回复 | StackOverflow 追问、Reddit "what's the best way to..." |
| **P2** | 竞品内容盲区 | 仅在前三级信号都没发现时列为补充项，标注"未经验证的需求信号" |

**信号严重度分级：**

| 级别 | 特征 | 内容策略 |
|------|------|---------|
| **断层级** | 大量用户问，网上无清晰答案 | 全篇核心卖点，Why + How 模块重点展开 |
| **抱怨级** | 用户对现有方案不满、指出局限性 | Features 模块的差异化对比点 |
| **困惑级** | 用户反复问同一个基础问题 | FAQ 模块的首要问题 |

核心规则：文档中每个模块至少有一个点来自 P0/P1 用户信号。

## Review & Edit Protocol (内容审核规范)

OpenClaw 输出 MD 文档后，用户在 Claude Code 中与 AI 协同审核：

```
OpenClaw 生成 MD 文档 → 飞书发送给用户
       ↓
用户复制内容，对 Claude Code 说："我们一起审一下这篇文档"
       ↓
Claude Code 展示内容
       ↓
用户提修改意见 → Claude Code 直接编辑 MD → 保存到 docs/content/
       ↓
用户确认："可以了，建站吧"
       ↓
Claude Code 用 hotpage-builder 建站部署
```

### 审核自查 3 项

1. **痛点锚定** — 每个模块是否至少有一个点来自 P0/P1 用户信号？
2. **事实准确性** — 抽查 1–2 个硬事实（版本号、命令、API 名），搜索验证
3. **语气可用性** — 读出来像"人在说话"还是 AI 在列 bullet？

### 修改路径

| 问题范围 | 处理方式 |
|---------|---------|
| 个别模块问题 | Claude Code 直接编辑对应 `## Module N` 段落 |
| 整体方向偏了 | 把文档扔回 OpenClaw，附纠正指令重出 |
| 缺用户信号 | 补充 Pain Points 链接和描述，要求 OpenClaw 按新信号重写 |

## Non-goals

- 不做 OpenClaw 与 Claude Code 的自动桥接（方案 B 留待量上来后再补）
- 不改变 hotpage-builder 和 webpage-builder 现有的建站流程
- 不在 OpenClaw 端做 SEO 技术实施（title 长度校验、JSON-LD 等仍在 Claude Code 端由 skill 负责）

## Success Criteria

1. OpenClaw 按模板输出的 MD 文档，Claude Code 无需二次整理即可直接建站
2. 每篇文档的 Pain Points 区域包含至少 3 个 P0/P1 用户信号
3. 审核-修改-建站全流程在单次 Claude Code 会话内完成
