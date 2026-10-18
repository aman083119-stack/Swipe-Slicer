<div align="center">

# ⚔️ Swipe Slicer

**Slice same-color chains. Dodge bombs. Chase combos.**

A fast, neon arcade game built for **YouTube Playables** — pure HTML5 Canvas, zero dependencies, fully responsive.

[![YouTube Playables](https://img.shields.io/badge/YouTube-Playables-FF0000?style=for-the-badge&logo=youtube)](https://developers.google.com/youtube/gaming/playables)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](#license)

<br/>

<img src="https://img.shields.io/badge/Platform-Web%20%7C%20Mobile-111827?style=flat-square" />
<img src="https://img.shields.io/badge/Engine-Canvas%202D-6366f1?style=flat-square" />
<img src="https://img.shields.io/badge/SDK-ytgame%20v1-ef4444?style=flat-square" />

</div>

---

## ✨ Features

| Feature | Description |
|--------|-------------|
| **Color combo chains** | Same-color slices in one continuous swipe build multipliers |
| **Arc physics** | Shapes launch from the bottom with gravity and wall bounces |
| **Bombs** | Slice a bomb → instant game over |
| **3-miss limit** | Let three shapes escape and the run ends |
| **Daily shape themes** | Classic · Crystal · Geo — rotates by calendar day |
| **Difficulty ramp** | Spawn rate & speed scale with score |
| **Neon polish** | Glow, particles, screen shake, floating score text |
| **Cloud high scores** | `ytgame.game.saveData` / `loadData` (localStorage fallback) |
| **Score reporting** | `ytgame.engagement.sendScore` for YouTube leaderboards |
| **Full responsive** | Fills viewport — 9:16, 1:1, 16:9, ultrawide, foldables |

---

## 🎮 How to play

1. **Swipe / drag** through shapes to slice them  
2. Hit **same colors in one swipe** for combo multipliers  
3. Avoid **bombs** (💣)  
4. Don’t let **3 shapes** leave the screen  

---

## 📁 Project structure

```
Swipe-Slicer/
├── index.html      # Shell + UI + Playables SDK script
├── game.js         # Full game + ytgame integration
└── README.md
```

Single-page, no build step. Open `index.html` or host the folder statically.

---

## 🔌 YouTube Playables integration

SDK is loaded **before** game code:

```html
<script src="https://www.youtube.com/game_api/v1"></script>
<script src="game.js"></script>
```

| Requirement | Implementation |
|-------------|----------------|
| `firstFrameReady()` | On first canvas paint |
| `gameReady()` | After init + first frame (no loading screen) |
| `IN_PLAYABLES_ENV` | Gates all SDK calls |
| `isAudioEnabled` + `onAudioEnabledChange` | Audio state sync |
| `onPause` / `onResume` | Freezes sim + shows pause overlay; auto-saves |
| `loadData` / `saveData` | High score persistence |
| `sendScore` | Best score on game over |
| Responsive layout | `resize` listener, DPR-aware canvas, zero-size WebView safe |
| Relative paths only | ✅ |
| No external network (beyond SDK) | ✅ |

> **No ads / monetization APIs** are used in this build.

---

## 🧪 Testing with the Playables Test Suite

1. Zip the project root (`index.html` + `game.js` + this README is fine).  
2. Open the [Playables SDK Test Suite](https://developers.google.com/youtube/gaming/playables/reference/test_suite_guide).  
3. Upload / point at your build and run the automated checks.  
4. For local CSP testing, override `Content-Security-Policy` in Chrome DevTools as documented by Google.

Local play works without the SDK (no-op). Full behavior appears inside YouTube / the Test Suite.

---

## 🚀 Run locally

```bash
# any static server, e.g.
npx serve .
# or
python -m http.server 8080
```

Then open `http://localhost:8080`.

---

## 💡 Ideas for future features

- Haptic feedback on slice / bomb (`navigator.vibrate`)
- Lightweight Web Audio SFX gated by `isAudioEnabled`
- Power-ups (slow-mo, color freeze, shield)
- Weekly challenge modes with fixed seeds
- Accessibility: high-contrast mode, reduced motion
- Tutorial overlay for first run
- Multi-language UI via `ytgame.system.getLanguage()`

---

## 📜 License

MIT — free to use, modify, and publish.

---

<div align="center">

**Made for YouTube Playables** · by [aman083119-stack](https://github.com/aman083119-stack)

</div>
