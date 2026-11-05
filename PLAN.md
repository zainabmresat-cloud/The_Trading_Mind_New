# Development Plan (PLAN.md)
## Project: **The Trading Mind**

---

## Milestone Roadmap Overview

```
+--------------------------------------------------------------------------+
|  M1: Planning & Setup                                                    |
|  [PRD, PLAN, TODO, Repository Structure, Tech Stack Verification]        |
+------------------------------------+-------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
|  M2: Python Analytics Backend Engine                                     |
|  [FastAPI App, Monte Carlo, Prospect Theory, Ruin & Tilt Math Models]    |
+------------------------------------+-------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
|  M3: Presentation Deck Engine & Design System                            |
|  [Modern Cyber/Terminal CSS, Slide Engine, Keyboard/Touch Controls]      |
+------------------------------------+-------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
|  M4: Three.js 3D Emotional Landscape                                     |
|  [3D Geometry/Shader, Morphing States: Flow, Greed, Fear, Tilt]          |
+------------------------------------+-------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
|  M5: 10 Interactive Slides Content & Widget Construction                 |
|  [Simulators, Calculators, Bias Diagnostic, Charts & Visualizers]        |
+------------------------------------+-------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
|  M6: Frontend-Backend Integration & Fallback Layer                       |
|  [REST API Client, Live Data Sync, Offline JS Mathematical Fallback]     |
+------------------------------------+-------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
|  M7: Polish, Quality Assurance & Verification                            |
|  [60fps Optimization, Cross-browser Test, End-to-End Walkthrough]       |
+--------------------------------------------------------------------------+
```

---

## Detailed Milestones

### Milestone 1: Planning, Architecture & Project Scaffolding
- **Goal**: Finalize requirements, specify file tree, establish coding conventions, and configure environment.
- **Deliverables**:
  - `PRD.md`, `PLAN.md`, `TODO.md`
  - Workspace directory tree layout:
    ```
    The_Trading_Mind_New/
    ├── backend/
    │   ├── app/
    │   │   ├── __init__.py
    │   │   ├── main.py
    │   │   ├── models.py
    │   │   └── analytics.py
    │   └── requirements.txt
    ├── frontend/
    │   ├── css/
    │   │   ├── main.css
    │   │   ├── slides.css
    │   │   └── components.css
    │   ├── js/
    │   │   ├── app.js
    │   │   ├── deck.js
    │   │   ├── three-scene.js
    │   │   ├── simulators.js
    │   │   └── api-client.js
    │   ├── assets/
    │   │   └── vendor/ (three.js, etc.)
    │   └── index.html
    ├── PRD.md
    ├── PLAN.md
    └── TODO.md
    ```
- **Exit Criteria**: User approval of planning artifacts.

---

### Milestone 2: Python Analytics Backend Engine
- **Goal**: Build a high-performance Python analytics service providing rigorous statistical trading models.
- **Key Modules**:
  1. `analytics.py`:
     - **Monte Carlo Ruin Engine**: Vectorized multi-path equity generator with drawdown distribution, bankruptcy probability, and Sharpe ratio.
     - **Prospect Theory Engine**: Kahneman-Tversky value function $v(x) = x^\alpha$ (for $x \ge 0$) and $v(x) = -\lambda(-x)^\beta$ (for $x < 0$), with cumulative probability weighting.
     - **Cognitive Decay / Tilt Model**: Mathematical model simulating performance degradation based on emotional state transitions.
     - **Trader Bias Diagnostic Scorer**: Multi-factor scoring mapping answers into psychological radar dimensions.
  2. `main.py`:
     - FastAPI application with CORS middleware, request validation (Pydantic), error handling, and structured JSON responses.
  3. `requirements.txt`:
     - `fastapi`, `uvicorn`, `numpy`, `scipy`, `pydantic`.
- **Exit Criteria**: All API endpoints pass unit tests and return verified mathematical calculations.

---

### Milestone 3: Presentation Deck Engine & Design System
- **Goal**: Construct a presentation shell with a high-end fintech terminal aesthetic.
- **Key Deliverables**:
  1. **Visual Theme**: Deep obsidian background (`#080B11`), frosted glass containers (`backdrop-filter: blur`), glowing neon accents (cyan `#00E5FF`, emerald `#00E676`, amber `#FFD600`, crimson `#FF1744`), clean monospace & sans typography.
  2. **Slide Engine (`deck.js`)**:
     - Seamless slide transition manager (smooth sliding/fade with GPU-accelerated transforms).
     - Keyboard navigation (Left/Right, Space, PageUp/PageDown, Home/End).
     - Touch/swipe gesture support for mobile/tablet.
     - Interactive slide progress indicator, slide drawer / overview grid, and slide jumping.
     - Presentation state sync with URL hash (`#slide-1` to `#slide-10`).
- **Exit Criteria**: A 10-slide template navigates smoothly with responsive scaling.

---

### Milestone 4: Three.js 3D Animated Mind Visualization
- **Goal**: Implement an animated, interactive 3D visualization representing the trader's mental state.
- **Key Deliverables**:
  1. **Scene Setup**: Scene, perspective camera, WebGLRenderer with anti-aliasing, subtle post-processing bloom or glowing particle points.
  2. **Geometry & Particle System**:
     - 3D neural brain / geodesic lattice mesh paired with an orbital particle field (1,500+ dynamic points).
  3. **Emotional State Morphing**:
     - **Flow State**: Harmonious turquoise wave oscillation, relaxed rotation speed.
     - **Greed / Euphoria**: Expanding golden shell, high-frequency kinetic pulsing.
     - **Fear / Panic**: Contractive crimson red deformation, jittery orbital trajectories.
     - **Tilt**: Chaotic multi-axis tumbling, spiky vertex displacement, flashing alarm glow.
  4. **Interactivity**: Orbit controls (mouse drag rotate/pan, wheel zoom), state selector buttons, and responsiveness to window resizing.
- **Exit Criteria**: 60 FPS 3D rendering on Slide 3 with instant, glitch-free emotional state transitions.

---

### Milestone 5: Interactive Slide Modules (Slides 1–10)
- **Goal**: Build interactive content and widgets for all 10 presentation slides.
- **Slide Specifications**:
  - **Slide 1: The Anatomy of a Trade** — Interactive hoverable brain regions & neurochemical pathway infographic.
  - **Slide 2: Neurochemistry of Risk** — Volatility slider directly altering simulated heart rate, cortisol vs dopamine gauges.
  - **Slide 3: The 3D Emotional Landscape** — Embedded Three.js canvas with live emotion switcher and particle density controls.
  - **Slide 4: Prospect Theory & Loss Aversion** — Interactive curve where users gamble vs lock in gains, plotting empirical loss aversion.
  - **Slide 5: The Tilt Spiral** — Interactive multi-round streak simulator showing how emotion triggers oversized revenge bets.
  - **Slide 6: Gambler's Fallacy & Recency Bias** — Coin toss / candle streak predictor proving independent probability fallacy.
  - **Slide 7: Law of Large Numbers & Expectancy** — Win rate vs R:R matrix with live 500-trade scatter simulation.
  - **Slide 8: Position Sizing & Risk of Ruin** — Comparative simulator: Kelly Criterion vs Fixed Fractional vs Martingale.
  - **Slide 9: Psychological Diagnostic Audit** — Interactive 6-factor questionnaire rendering a live radar chart of trading vulnerabilities.
  - **Slide 10: The Master Trader Blueprint** — Interactive rulebook generator with checklist and exportable session protocol.
- **Exit Criteria**: All 10 slides contain working interactive elements with immediate visual feedback.

---

### Milestone 6: Backend Integration & Offline Fallback Strategy
- **Goal**: Connect frontend components to the Python FastAPI backend, while ensuring zero breakage if run offline.
- **Key Deliverables**:
  1. `api-client.js`: Asynchronous fetch client with automatic latency detection and health checks.
  2. **Dual-Mode Computation (Hybrid Architecture)**:
     - *Online Mode*: Frontend sends parameters to FastAPI backend, receiving high-fidelity Monte Carlo simulations (up to 5,000 runs) and statistical distributions.
     - *Offline Mode (Fallback)*: If backend is unreachable, frontend seamlessly executes pure JavaScript mathematical approximations with an unobtrusive indicator (`Status: Local Client Engine`).
- **Exit Criteria**: Switching the backend on/off does not crash or break any slide feature.

---

### Milestone 7: Performance Optimization, Polish & Verification
- **Goal**: Polish visual aesthetics, eliminate lag, test edge cases, and verify across browsers.
- **Key Deliverables**:
  - 60 FPS verified WebGL performance.
  - Accessibility audit (color contrast, keyboard navigability).
  - Sound effects / subtle haptic audio feedback (with mute toggle).
  - Complete user manual & setup instructions in `README.md`.
- **Exit Criteria**: Zero console errors, fully responsive design, fluid presentation ready for delivery.
