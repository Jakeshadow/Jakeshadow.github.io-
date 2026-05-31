# MarkItDown Production Guide — Design Spec
**Date:** 2026-05-31 | **Status:** Draft → Approved

## Problem Statement

MarkItDown's official docs and competing content stop at installation and basic usage. Four real-world needs go unanswered: batch processing hundreds of files, troubleshooting errors, deploying in production, and comparing LLM output quality. This page fills those gaps, targeting search terms like "markitdown batch processing," "markitdown docker," and "markitdown llm comparison."

## Proposed Solution

**Architecture:** A single `projects/markitdown/index.html` file with a supporting `assets/` subdirectory, following the existing project detail page pattern (reuses `../../css/style.css` + page-level inline `<style>` overrides). Pure English, pure static.

**File tree (new files only):**
```
projects/markitdown/
  index.html                 # The page
  assets/
    screenshot1.png          # Terminal screenshot for error FAQ
    screenshot2.png          # LLM comparison screenshot
```

**Page structure (top to bottom, single long-scroll):**

1. **Hero** — Title "MarkItDown in Production" + value proposition + 4 anchor nav buttons (Batch / Errors / Docker / LLM)
2. **Batch Processing** — Script code block + usage explanation + performance notes
3. **Error FAQ** — Common errors with terminal screenshots + solutions
4. **Docker Deployment** — docker-compose.yml + FastAPI wrapper code
5. **LLM Comparison** — Three-column comparison table (GPT vs Claude vs Gemini) with ratings and examples
6. **FAQ** — General FAQ accordion section

**Navigation:** "← Back to Home" link at top, same pattern as existing project pages.

## Technical Constraints

| Item | Decision |
|------|----------|
| Stack | Pure HTML/CSS/JS, reuses `../../css/style.css`, page-level inline `<style>` |
| New dependencies | None |
| Code highlighting | Pure CSS pseudo-highlighting via `<pre>` + `<code>` tags, no highlight.js |
| Browser support | Modern browsers, last 2 versions |
| Responsive | Inherit breakpoints from `style.css` (480px / 640px / 768px) |
| Deployment | Git push to `main` → GitHub Pages at `projects/markitdown/` |

## Non-goals

- No basic installation guide (pip install, setup)
- No multi-page site
- No comments or user feedback systems
- No Google Analytics
- No Chinese version

## Success Criteria

1. **Search gap filled** — Page contains substantive original content for "markitdown batch/docker/llm comparison" queries
2. **Copy-paste ready** — Every code block is self-contained and runnable as-is
3. **Instant deploy** — `git push` to `main`, live within 2 minutes at `https://<username>.github.io/<repo>/projects/markitdown/`
