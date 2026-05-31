# MoneyPrinterTurbo Review Page — Design Spec
**Date:** 2026-05-31 | **Status:** Draft → Approved

## Problem Statement

Overseas beginners searching for "MoneyPrinterTurbo tutorial" find fragmented results — GitHub READMEs, scattered forum threads, and clickbait videos. The top-ranked content doesn't answer two questions that block adoption: **"Does this actually work?"** and **"Is it really free?"** This page exists to be the definitive answer to those two questions, with real screenshots and honest evaluation, so someone can decide in under 60 seconds whether MPT is worth their time.

## Proposed Solution

**Architecture:** A single `mpt-review.html` file in the `projects/` directory, following the existing project detail page pattern (reuses `../css/style.css` + page-level inline `<style>` overrides). One tiny inline `<script>` for FAQ accordion behavior — no new JS file.

**File tree (new files only):**
```
assets/mpt/screenshot1.png     # Before/after comparison screenshot
assets/mpt/screenshot2.png     # UI / workflow screenshot
projects/mpt-review.html        # The page
```

**Page structure (top to bottom, single long-scroll):**

1. **Hero** — Title "MoneyPrinterTurbo: Free AI Video Generator — Does It Work?" with verdict upfront ("Yes — and here's the proof"), CTA jumps to results section
2. **What Is It?** — 2-3 sentence overview: what it does, who made it, GitHub stars badge
3. **Results At A Glance** — Side-by-side before/after screenshots with a mini comparison table (quality, speed, ease of use)
4. **Is It Free?** — Clear breakdown: what's free vs. what might cost money (API keys), the "gotcha" transparency that builds trust
5. **Quick Setup** — 5-step numbered guide, each step with one screenshot + one sentence, beginner-friendly
6. **Resources** — Curated links: GitHub repo, official docs, best video tutorial found
7. **FAQ** — Accordion, 5-6 questions (commercial use, GPU requirements, supported languages, etc.)

**Navigation:** "← Back to Home" link at top, same pattern as existing project pages.

## Technical Constraints

| Item | Decision |
|------|----------|
| Stack | Pure HTML + CSS (reuse `css/style.css` + page-level inline `<style>`) + inline JS for FAQ accordion |
| New dependencies | None — no frameworks, no build tools, no npm |
| Browser support | Modern browsers (Chrome/Firefox/Safari/Edge, last 2 versions) |
| Performance | Single page, ~2 screenshots optimized to compressed PNG, Google Fonts cached by existing pages |
| Responsive | Inherit breakpoints from `style.css` (480px / 768px / 1024px) |
| SEO | `<meta description>`, semantic HTML (`section`, `article`), h1-h3 hierarchy |
| Deployment | Git push to `main` → GitHub Pages auto-deploys (already configured) |

## Non-goals

- No CMS or backend — pure static page, content written directly in HTML
- No multi-page structure — all info on one scrolling page
- No user-generated content — no comments, ratings, or submissions
- No analytics — no Google Analytics or tracking; add only if traffic justifies it
- No video content — screenshots + text review only
- No multilingual support — English only, no i18n

## Success Criteria

1. **5-second trust check** — A visitor lands and can answer "Does it work?" and "Is it free?" within 5 seconds
2. **Scannable depth** — Page is long but well-layered; users can easily jump to the section they care about (Setup / Review / FAQ)
3. **Instant deploy** — `git push` to `main`, live at `https://<username>.github.io/projects/mpt-review.html` within 2 minutes
4. **Zero-dependency maintenance** — One HTML file + two screenshots; editable and re-deployable with no toolchain
