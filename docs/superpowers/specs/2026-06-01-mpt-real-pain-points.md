# MPT Real Pain Points — Lessons from a 4-Hour Install Marathon

**Date:** 2026-06-01 | **Status:** Draft

## Problem Statement

Today I (a technical user) spent ~4 hours getting MoneyPrinterTurbo v1.1.0 to generate one video on Windows 11 (China). Every single step hit an issue. This document catalogs every bug, fix, and workaround — organized by audience type — to feed into the MPT review page.

## Audience Split

| | Beginner Path | Programmer Path |
|---|---|---|
| **MPT Version** | v1.1.0 (Streamlit Web UI) | v1.2.9 (API-only, CLI) |
| **LLM** | Qwen (DashScope/Bailian) — free, China direct | Any OpenAI-compatible provider |
| **Interface** | Browser at localhost:8501 | curl / custom scripts |
| **Expected Time** | ~30 min (after fixes) | ~15 min |
| **Reality (China)** | 2-4 hours | 1-2 hours |

---

## Bug Catalog (18 Total)

### 1. Git Clone Fails Repeatedly
- **Symptom:** `RPC failed`, `early EOF`, `fetch-pack unexpected disconnect`
- **Root Cause:** GitHub blocked/throttled in China; full repo is large
- **Region:** China-specific
- **Fix:** `git clone --branch v1.1.0 --depth 1 https://github.com/harry0703/MoneyPrinterTurbo.git` (shallow clone, ~80% less data)
- **Audience:** Both

### 2. pip install Timeout via Tsinghua Mirror
- **Symptom:** `pip install -r requirements.txt` hangs/timeout
- **Root Cause:** Tsinghua mirror throttling
- **Region:** China-specific
- **Fix:** `pip install -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple/`
- **Audience:** Both

### 3. VPN Toggle Hell
- **Symptom:** Need VPN ON for GitHub/Pexels/Edge TTS, VPN OFF for pip mirrors
- **Root Cause:** Split routing: China mirrors don't work through VPN, overseas services don't work without it
- **Region:** China-specific
- **Fix:** Use a split-tunnel VPN (Clash/V2Ray); if not available, toggle manually: VPN ON for git/pip (overseas packages only)/Pexels/TTS, VPN OFF for pip mirrors
- **Audience:** Both (China)

### 4. v1.2.9 Has No Web GUI
- **Symptom:** Installed latest, only /docs API page, no Streamlit UI
- **Root Cause:** v1.2.x dropped the Streamlit Web UI, API-only
- **Fix:** Use `git checkout v1.1.0` for the Web UI version
- **Audience:** Both

### 5. moviepy v2.0.0 Breaks MPT
- **Symptom:** `ModuleNotFoundError: No module named 'moviepy.editor'`
- **Root Cause:** moviepy v2.0.0 removed the `moviepy.editor` module that MPT v1.1.0 depends on
- **Fix:** `pip install moviepy==1.0.3`
- **Audience:** Both

### 6. g4f Free Providers All Dead
- **Symptom:** `RetryProviderError: RetryProvider failed` — all free GPT providers return errors
- **Root Cause:** Free g4f providers are unstable/unmaintained/blocked; missing dependencies: `curl_cffi`, `undetected_chromedriver`, `platformdirs`
- **Fix:** Switch to Qwen (DashScope) — free quota, China direct. Or Moonshot, or any OpenAI-compatible provider
- **Audience:** Both (g4f is the default in config.example.toml)

### 7. Moonshot Insufficient Balance
- **Symptom:** `Error code: 429 - account suspended due to insufficient balance`
- **Root Cause:** Moonshot API key has no free credits left
- **Fix:** Register at https://dashscope.console.aliyun.com/ (Qwen/Bailian), get free key with million-token quota
- **Audience:** Both

### 8. edge-tts 403 Forbidden (China)
- **Symptom:** `WSServerHandshakeError: 403, message='Invalid response status'` from `speech.platform.bing.com`
- **Root Cause:** Microsoft Bing Speech service is blocked in China
- **Region:** China-specific
- **Fix:** Must have VPN ON. Also upgrade: `pip install edge-tts --upgrade`
- **Audience:** Both (China)

### 9. edge-tts Removed `mktimestamp`
- **Symptom:** `ImportError: cannot import name 'mktimestamp' from 'edge_tts.submaker'`
- **Root Cause:** edge-tts package upgraded and removed the `mktimestamp` utility function
- **Fix:** Add local implementation to `app/services/voice.py` (line 5):
  ```python
  def mktimestamp(seconds: float) -> str:
      hrs = int(seconds // 3600)
      mins = int((seconds % 3600) // 60)
      secs = int(seconds % 60)
      millis = int((seconds % 1) * 1000)
      return f"{hrs:02d}:{mins:02d}:{secs:02d}.{millis:03d}"
  ```
- **Audience:** Both

### 10. edge-tts Renamed `subs` to `cues`
- **Symptom:** `'SubMaker' object has no attribute 'subs'`
- **Root Cause:** edge-tts renamed `.subs` → `.cues` (list of Subtitle objects instead of strings)
- **Fix:** In `app/services/voice.py`:
  - Line 1017: `sub_maker.subs` → `sub_maker.cues`
  - Line 1087: Replace `zip(sub_maker.offset, sub_maker.subs)` with iteration over `sub_maker.cues`, using `.content` for text and `.start.total_seconds()`/`.end.total_seconds()` for timestamps
- **Audience:** Both

### 11. edge-tts Removed `offset` Attribute
- **Symptom:** `'SubMaker' object has no attribute 'offset'`
- **Root Cause:** edge-tts removed `.offset`, timestamps now live in `Subtitle.start`/`.end` as timedelta objects
- **Fix:** In `get_audio_duration()` (voice.py ~line 1125):
  ```python
  def get_audio_duration(sub_maker):
      if not sub_maker.cues:
          return 0.0
      return sub_maker.cues[-1].end.total_seconds()
  ```
- **Audience:** Both

### 12. edge-tts Changed `create_sub` to `feed`
- **Symptom:** `sub_maker.cues is None` (no cues populated after streaming)
- **Root Cause:** Old API: `sub_maker.create_sub((offset, duration), text)`. New API: `sub_maker.feed(chunk)` — takes the raw chunk dict directly
- **Fix:** In voice.py `_do()` function (line 1013):
  ```python
  # Old:
  sub_maker.create_sub((chunk["offset"], chunk["duration"]), chunk["text"])
  # New:
  sub_maker.feed(chunk)
  ```
- **Audience:** Both

### 13. edge-tts Dropped `WordBoundary` Chunks
- **Symptom:** `sub_maker.cues is None` even after `feed()` fix
- **Root Cause:** New edge-tts only emits `SentenceBoundary` chunks (not `WordBoundary`). The condition `chunk["type"] == "WordBoundary"` never matches
- **Fix:** Change condition to accept both (voice.py line 1012):
  ```python
  # Old:
  elif chunk["type"] == "WordBoundary":
  # New:
  elif chunk["type"] in ("WordBoundary", "SentenceBoundary"):
  ```
- **Audience:** Both

### 14. moviepy Renamed `temp_audiofile_path`
- **Symptom:** `write_videofile() got an unexpected keyword argument 'temp_audiofile_path'`
- **Root Cause:** moviepy v1.0.3 uses `temp_audiofile` not `temp_audiofile_path`
- **Fix:** Replace all `temp_audiofile_path` → `temp_audiofile` in `app/services/video.py`
- **Audience:** Both

### 15. FFmpeg Can't Determine Output Format
- **Symptom:** `Unable to choose an output format for 'D:\...\tasks\<uuid>'`
- **Root Cause:** `temp_audiofile` was set to a directory path instead of a file path with extension
- **Fix:** Change `temp_audiofile=output_dir` → `temp_audiofile=os.path.join(output_dir, "temp_audio.m4a")` (video.py lines 109, 256)
- **Audience:** Both

### 16. Windows Virtual Memory Too Small
- **Symptom:** `OSError: [WinError 1455] The paging file is too small`
- **Root Cause:** FFmpeg spawned by moviepy needs more memory than available in Windows virtual memory pool
- **Fix:** Close unnecessary programs. Kill stale ffmpeg processes: `taskkill /F /IM ffmpeg.exe`. If still fails: Settings → System → About → Advanced system settings → Performance → Advanced → Virtual memory → Custom: Initial 4096, Max 8192 → Restart
- **Region:** Windows-specific
- **Audience:** Both (mostly beginners with low-spec machines)

### 17. Empty Voice Name = Silent Failure
- **Symptom:** `Invalid voice ''` — TTS fails 3 times, then task returns None (AttributeError in Streamlit)
- **Root Cause:** No voice selected in Streamlit sidebar; voice_name defaults to empty string
- **Fix:** Must select a voice from the Speech Synthesis dropdown (e.g., `en-US-AnaNeural-Female`)
- **Audience:** Both (UX trap)

### 18. Whisper Model Download Hangs (China)
- **Symptom:** Subtitle fallback to Whisper downloads `large-v3` model (~3GB) from Hugging Face — extremely slow in China
- **Root Cause:** Edge TTS subtitle creation fails due to SentenceBoundary-only chunks + matching logic incompatibility, falling back to Whisper
- **Region:** China-specific (HF throttled)
- **Fix:** Uncheck "Enable Subtitles" in Streamlit to skip Whisper entirely. Or pre-download model via HF mirror
- **Audience:** Both

---

## Summary: Files Modified

All changes are in `D:\Projects\MoneyPrinterTurbo\app\services\`:

| File | Changes |
|------|---------|
| `voice.py` | 5 fixes: mktimestamp (add), subs→cues, offset→cues[-1].end, create_sub→feed, WordBoundary→SentenceBoundary |
| `video.py` | 2 fixes: temp_audiofile_path→temp_audiofile, directory→file path |
| `config.toml` | llm_provider=qwen, pexels_api_keys filled |

## Summary: Dependency Versions That Work

```
moviepy==1.0.3          # NOT 2.0.0+
edge-tts (latest)       # but requires 5 code patches above
dashscope (latest)      # still compatible with Qwen/Bailian keys
```

## What This Means for the Review Page

The current review page needs a "Real Setup Guide" overhaul:

1. **Split into Beginner vs Programmer tabs/sections** — clear gate at the top
2. **Beginner path**: v1.1.0 + pre-patched code (link to a forked repo or gist with the 7 code fixes) + Qwen API key + Pexels key + VPN ON + no subtitles
3. **Programmer path**: v1.2.9 + API docs + "you know what you're doing"
4. **China-specific callouts**: VPN toggles, mirror URLs, Bing TTS blockage
5. **Honest verdict**: "MPT works, but expect 2-4 hours of debugging on first install"
