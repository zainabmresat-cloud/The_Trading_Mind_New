# The Trading Mind

> **Neuro-Finance & Trading Psychology — Interactive Presentation System**

A fully self-contained, 10-slide interactive presentation that bridges quantitative finance and trading psychology. The frontend runs entirely in the browser (including offline) while an optional Python FastAPI backend delivers high-fidelity Monte Carlo simulations and behavioral analytics.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [The 10 Slides](#the-10-slides)
- [Interactive Features](#interactive-features)
- [Installation](#installation)
- [Running the Backend](#running-the-backend)
- [Running the Frontend](#running-the-frontend)
- [API Reference](#api-reference)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Architecture Notes](#architecture-notes)
- [Repository](#repository)

---

## Project Overview

**The Trading Mind** teaches traders how psychology shapes every decision — from individual trade entries to full account blowups. It presents rigorous mathematical models (Prospect Theory, Monte Carlo ruin simulation, Tilt decay) alongside interactive widgets so the audience can experience the concepts in real time.

| Feature | Detail |
|---------|--------|
| Slides | 10 interactive modules |
| Backend | FastAPI Python analytics engine |
| Frontend | Vanilla HTML/CSS/JS — zero build step |
| 3D Engine | Three.js r134 (locally bundled) |
| Offline mode | Full client-side JS fallbacks for all simulations |
| Protocol | Works via `file://` or any local HTTP server |

---

## Technology Stack

### Backend
| Package | Version | Purpose |
|---------|---------|---------|
| Python | ≥ 3.10 | Runtime |
| FastAPI | ≥ 0.110 | REST API framework |
| Uvicorn | ≥ 0.28 | ASGI server |
| NumPy | ≥ 1.26 | Vectorised Monte Carlo |
| SciPy | ≥ 1.12 | Statistical distributions |
| Pydantic | ≥ 2.6 | Request/response validation |
| httpx | ≥ 0.27 | Async HTTP (test client) |
| pytest | ≥ 8.0 | Test suite (17 tests) |

### Frontend
| Technology | Purpose |
|-----------|---------|
| HTML5 / CSS3 | Semantic markup, glassmorphism design system |
| Vanilla JavaScript (ES5-compatible IIFE) | Slide engine, simulations, API client |
| Three.js r134 (UMD, locally bundled) | WebGL 3D emotional landscape — Slide 3 |
| Web Audio API | Synthesised sound effects (zero external deps) |
| Canvas 2D | S-curves, equity paths, scatter plots, radar charts |
| Google Fonts — Inter + JetBrains Mono | Typography |

---

## Project Structure

```
The_Trading_Mind_New/
│
├── index.html                  # Single-page presentation host (10 slides, 1,095 lines)
│
├── css/
│   ├── main.css                # Global palette, typography, glassmorphism surfaces
│   ├── slides.css              # Slide transitions, progress bar, overview modal
│   └── components.css          # Sliders, gauges, stat badges, likert buttons
│
├── js/
│   ├── vendor/
│   │   └── three.min.js        # Three.js r134 UMD build (601 KB, no CDN)
│   ├── deck.js                 # Slide engine — navigation, touch, URL hash, overview
│   ├── three-scene.js          # WebGL scene — brain mesh, particles, emotional states
│   ├── api-client.js           # XHR wrapper for FastAPI backend (graceful fallback)
│   ├── simulators.js           # SimMath + SimDraw + all 10 slide init functions
│   └── app.js                  # Bootstrapper — audio, backend polling, slide events
│
├── backend/
│   ├── run.py                  # Convenience launcher (python run.py)
│   ├── requirements.txt
│   └── app/
│       ├── __init__.py
│       ├── main.py             # FastAPI application, CORS, 5 route handlers
│       ├── models.py           # Pydantic request/response schemas
│       └── analytics.py        # Monte Carlo, Prospect Theory, Tilt, Bias engines
│
├── backend/tests/
│   ├── __init__.py
│   └── test_analytics.py       # 17 pytest unit tests (all passing)
│
├── PRD.md                      # Product Requirements Document
├── PLAN.md                     # Milestone roadmap
├── TODO.md                     # Task checklist
└── README.md                   # This file
```

---

## The 10 Slides

| # | Title | Category | Key Interactive Element |
|---|-------|----------|------------------------|
| 01 | **The Anatomy of a Trade** | Neuro-Cognitive Architecture | Hoverable brain-region stat cards; animated neurochemical telemetry ticker (Dopamine / Cortisol / Serotonin) |
| 02 | **The Neurochemistry of Market Stress** | Physiology Under Pressure | Volatility + Drawdown sliders → live Heart Rate (BPM), Cortisol (µg/dL), Executive Function (%) dials with phase indicator |
| 03 | **The 3D Emotional Landscape** | Psycho-Emotional States | Three.js WebGL brain — switch between FLOW / GREED / FEAR / TILT states; mouse-drag orbit, scroll zoom, 1,800-particle field |
| 04 | **Prospect Theory & Loss Aversion** | Behavioural Finance | Kahneman-Tversky S-curve (Canvas 2D); interactive gain vs loss choice experiment plots your personal bias fingerprint |
| 05 | **The Tilt Spiral & Revenge Trading** | Emotional Risk Escalation | Consecutive-losses slider → decision quality decay curve; real-time risk-multiplier; backend-enhanced when FastAPI is online |
| 06 | **Gambler's Fallacy & Recency Bias** | Cognitive Biases | Candle-streak predictor — make a BULLISH/BEARISH call then reveal the next candle; running accuracy vs 50% true probability |
| 07 | **Law of Large Numbers & Expectancy** | Statistical Edge | Win-rate + R:R sliders → Expectancy Formula (R); live 500-trade scatter simulation with P&L distribution |
| 08 | **Position Sizing & Risk of Ruin** | Capital Management | Kelly Criterion / Fixed Fractional / Martingale equity-curve canvas; drawdown visualiser; Monte Carlo backend upgrade |
| 09 | **Psychological Diagnostic Audit** | Self-Assessment | 6-question Likert-scale quiz → live SVG radar chart (Impulsivity / Loss Aversion / Overconfidence / Discipline / FOMO / Recency); backend archetype scoring |
| 10 | **The Master Trader Blueprint** | Framework & Protocol | Pre-trade checklist (interactive checkboxes); exportable Trader Psychology Protocol as `trading_mind_protocol.json` |

---

## Interactive Features

### Presentation Controls
- **Backend status pill** — top-right header shows `ENGINE: FASTAPI ONLINE` (green) or `ENGINE: CLIENT FALLBACK` (amber) in real time, polled every 15 seconds
- **Sound toggle** (🔊) — Web Audio synthesiser for slide transitions and button clicks; click to mute/unmute
- **Slide overview** (☷) — grid thumbnail modal of all 10 slides for quick jumping
- **Fullscreen** (⛶) — enters browser fullscreen mode
- **Help** (?) — keyboard shortcut reference overlay

### Keyboard Shortcuts

| Key(s) | Action |
|--------|--------|
| `→` / `Space` / `PageDown` | Next slide |
| `←` / `PageUp` | Previous slide |
| `Home` | First slide |
| `End` | Last slide |
| `1`–`9` | Jump to slide 1–9 |
| `0` | Jump to slide 10 |
| `O` | Toggle overview grid |
| `F` | Toggle fullscreen |
| `?` / `H` | Toggle keyboard help |
| `Esc` | Close overview / help |

### Touch & Mobile
Swipe left/right gesture navigation is supported on touch devices.

### Dual-Mode Computation
Every simulation runs in two modes automatically:

| Mode | Condition | Engine |
|------|-----------|--------|
| **FastAPI Online** | Backend reachable on `localhost:8000` | Python NumPy/SciPy — up to 5,000 Monte Carlo paths |
| **Client Fallback** | Backend offline / unreachable | Pure JavaScript `SimMath` — instant, no server required |

The switch is seamless — the status pill is the only visual indicator.

---

## Installation

### Prerequisites

- **Python 3.10+** (project developed on Python 3.12)
- **pip** (bundled with Python)
- A modern browser (Chrome 90+, Firefox 90+, Edge 90+, Safari 15+)

### Clone the Repository

```bash
git clone https://github.com/zainabmresat-cloud/The_Trading_Mind_New.git
cd The_Trading_Mind_New
```

### Install Python Dependencies

```bash
pip install -r backend/requirements.txt
```

> **Windows tip:** If `pip` is not in your PATH, use `python -m pip install -r backend/requirements.txt`

To verify the installation, run the test suite:

```bash
pytest backend/tests/ -v
```

Expected output: **17 passed**.

---

## Running the Backend

The FastAPI analytics engine is **optional** — the presentation runs fully without it. Launch it to unlock high-fidelity Monte Carlo simulations (up to 5,000 paths) and backend-scored bias diagnostics.

### Option A — Convenience launcher (recommended on Windows)

Run from the project root:

```bash
python run.py
```

### Option B — Uvicorn directly

```bash
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

Both commands start the server at **http://127.0.0.1:8000**

Once running, the presentation header pill will switch to **`ENGINE: FASTAPI ONLINE`** within 15 seconds (or on the next page load).

### Interactive API Docs

FastAPI's auto-generated documentation is available while the server is running:

| URL | Description |
|-----|-------------|
| http://127.0.0.1:8000/docs | Swagger UI — interactive endpoint explorer |
| http://127.0.0.1:8000/redoc | ReDoc — clean reference documentation |
| http://127.0.0.1:8000/api/health | Health check endpoint (JSON) |

---

## Running the Frontend

The frontend is a single HTML file with no build step.

### Option A — Open directly in browser (simplest)

Navigate to the project folder in Windows Explorer and double-click `index.html`.

> **Note:** Google Fonts require an internet connection when opening via `file://`. The layout and all interactive features work fully offline without them (system fonts are used as fallback).

### Option B — Local HTTP server (recommended for full feature parity)

Using Python's built-in server from the project root:

```bash
python -m http.server 5500
```

Then open **http://localhost:5500** in your browser.

Using Node.js `http-server` (if installed):

```bash
npx http-server . -p 5500
```

Using VS Code **Live Server** extension: right-click `index.html` → *Open with Live Server*.

### Full Stack (Backend + Frontend together)

**Terminal 1 — Backend:**
```bash
cd The_Trading_Mind_New
python run.py
```

**Terminal 2 — Frontend:**
```bash
cd The_Trading_Mind_New
python -m http.server 5500
```

Then open **http://localhost:5500** — the status pill will show `ENGINE: FASTAPI ONLINE`.

---

## API Reference

All endpoints accept and return JSON. CORS is open (`*`) for local browser access.

### `GET /api/health`
Health check. Returns server status and timestamp.

```json
{
  "status": "ok",
  "version": "1.0.0",
  "service": "The Trading Mind Analytics Engine",
  "timestamp": "2026-11-06T09:00:00+00:00"
}
```

---

### `POST /api/simulate/prospect-theory`
Kahneman-Tversky value function curve.

**Request:**
```json
{
  "gains": [0, 500, 1000, 2000],
  "losses": [0, -500, -1000, -2000],
  "alpha": 0.88,
  "beta": 0.88,
  "lambda": 2.25
}
```

---

### `POST /api/simulate/monte-carlo-ruin`
Vectorised multi-path equity simulation.

**Request:**
```json
{
  "win_rate": 0.55,
  "payoff_ratio": 1.5,
  "risk_per_trade": 0.02,
  "n_paths": 1000,
  "n_trades": 200
}
```

**Response includes:** `ruin_probability`, `median_equity`, `sharpe_ratio`, `max_drawdown_median`, equity path samples.

---

### `POST /api/simulate/tilt-decay`
Emotional tilt and decision quality degradation model.

**Request:**
```json
{
  "consecutive_losses": 4,
  "leverage": 1.0
}
```

**Response includes:** `decision_quality`, `risk_multiplier`, `tilt_stage`, `recommended_action`.

---

### `POST /api/analytics/diagnose-bias`
Multi-dimensional trader bias scorer.

**Request:**
```json
{
  "responses": {
    "q1": 4,
    "q2": 3,
    "q3": 5,
    "q4": 2,
    "q5": 4,
    "q6": 3
  }
}
```

**Response includes:** `radar_scores` (6 dimensions), `archetype`, `vulnerability_score`, `recommendations`.

---

## Architecture Notes

### Script Load Order
The following load order in `index.html` is intentional and must be preserved:

```
js/vendor/three.min.js   →  Three.js UMD global (window.THREE)
js/deck.js               →  Slide engine (window.DeckEngine)
js/three-scene.js        →  WebGL scene (window.ThreeScene) — reads window.THREE
js/api-client.js         →  API wrapper (window.ApiClient)
js/simulators.js         →  Sim engine (window.TradingSimulators) — reads ApiClient
js/app.js                →  Bootstrapper — wires everything together on DOMContentLoaded
```

### Three.js — Local Bundle
Three.js r134 UMD build is bundled at `js/vendor/three.min.js` (601 KB). No CDN is used, ensuring the presentation works in environments without internet access and eliminating versioning drift.

### Offline-First Design
The presentation is designed to function completely at `file://` with zero network dependency (except Google Fonts for typography). All simulations have pure-JavaScript fallbacks in `SimMath` that activate automatically when the backend is offline.

---

## Repository

**GitHub:** https://github.com/zainabmresat-cloud/The_Trading_Mind_New

```
git clone https://github.com/zainabmresat-cloud/The_Trading_Mind_New.git
```

### Commit History

| Commit | Milestone |
|--------|-----------|
| `5bf79bb` | Milestones 5–6: Interactive Simulations and API Integration |
| `d62e5fa` | Milestone 4: Three.js 3D Animated Mind Visualization |
| `f560637` | Milestone 3: Interactive Presentation Deck |
| `06295b1` | Milestone 2: Python Analytics Backend |
| `3490be5` | Milestone 1: Planning and Architecture |

---

*The Trading Mind — Neuro-Finance & Trading Psychology Presentation System*
