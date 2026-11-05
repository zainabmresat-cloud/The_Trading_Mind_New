# Task Checklist (TODO.md)
## Project: **The Trading Mind**

---

### Phase 1: Planning & Architecture Validation (Completed)
- [x] Create Product Requirements Document ([`PRD.md`](file:///C:/Users/ragha/OneDrive/Desktop/The_Trading_Mind_New/PRD.md))
- [x] Create Development Milestones Roadmap ([`PLAN.md`](file:///C:/Users/ragha/OneDrive/Desktop/The_Trading_Mind_New/PLAN.md))
- [x] Create Step-by-Step Task Checklist ([`TODO.md`](file:///C:/Users/ragha/OneDrive/Desktop/The_Trading_Mind_New/TODO.md))
- [x] Present planning files to user and obtain approval to proceed to development

---

### Phase 2: Python Analytics Backend Development (Completed)
- [x] Initialize Python backend environment and structure ([`backend/`](file:///C:/Users/ragha/OneDrive/Desktop/The_Trading_Mind_New/backend/))
- [x] Create `backend/requirements.txt` (`fastapi`, `uvicorn`, `numpy`, `scipy`, `pydantic`, `pytest`) ([`requirements.txt`](file:///C:/Users/ragha/OneDrive/Desktop/The_Trading_Mind_New/backend/requirements.txt))
- [x] Implement `backend/app/models.py` (Pydantic request/response data schemas) ([`models.py`](file:///C:/Users/ragha/OneDrive/Desktop/The_Trading_Mind_New/backend/app/models.py))
- [x] Implement `backend/app/analytics.py`: ([`analytics.py`](file:///C:/Users/ragha/OneDrive/Desktop/The_Trading_Mind_New/backend/app/analytics.py))
  - [x] Kahneman-Tversky Prospect Theory utility function calculations
  - [x] Vectorized Monte Carlo Ruin Simulator (1,000–5,000 paths, equity curves, drawdown distributions)
  - [x] Kelly Criterion, Fixed Fractional, and Martingale ruin risk formulas
  - [x] Psychological Tilt & Cognitive Fatigue degradation curves
  - [x] Trader Bias diagnostic assessment scoring and radar dimensions
- [x] Implement `backend/app/main.py`: ([`main.py`](file:///C:/Users/ragha/OneDrive/Desktop/The_Trading_Mind_New/backend/app/main.py))
  - [x] FastAPI instance with CORS middleware for seamless local browser access
  - [x] Route `/api/health`
  - [x] Route `/api/simulate/prospect-theory`
  - [x] Route `/api/simulate/monte-carlo-ruin`
  - [x] Route `/api/simulate/tilt-decay`
  - [x] Route `/api/analytics/diagnose-bias`
- [x] Test all endpoints via comprehensive test suite (17 passed) ([`test_analytics.py`](file:///C:/Users/ragha/OneDrive/Desktop/The_Trading_Mind_New/backend/tests/test_analytics.py))

---

### Phase 3: Presentation Deck Engine & Design System
- [ ] Scaffold frontend directory structure (`frontend/css/`, `frontend/js/`, `frontend/assets/`)
- [ ] Implement `frontend/css/main.css`:
  - [ ] Dark financial terminal color palette (obsidian, neon cyan, emerald, amber, crimson)
  - [ ] Typography, glassmorphism card surfaces, glowing border treatments
  - [ ] Responsive grid and flexbox layout primitives
- [ ] Implement `frontend/css/slides.css`:
  - [ ] Fullscreen slide container and transition animations (slide horizontal, fade)
  - [ ] Progress bar, slide counter, and navigation dock
  - [ ] Overview drawer / grid thumbnail modal
- [ ] Implement `frontend/css/components.css`:
  - [ ] Custom styled sliders, toggles, gauges, stat badges, and interactive controls
- [ ] Implement `frontend/js/deck.js`:
  - [ ] Keyboard navigation listener (Arrow keys, Spacebar, PageUp/PageDown)
  - [ ] Touch swipe gesture detection for mobile / tablet
  - [ ] Hash navigation synchronization (`#slide-1` to `#slide-10`)
  - [ ] Fullscreen toggle and slide overview modal
- [ ] Implement initial `frontend/index.html` skeleton with all 10 slide containers

---

### Phase 4: Three.js 3D Animated Mind Visualization
- [ ] Set up Three.js in `frontend/assets/vendor/` or local ESM loader
- [ ] Implement `frontend/js/three-scene.js`:
  - [ ] WebGL renderer initialization, camera, scene graph, lighting, and resize handling
  - [ ] 3D Neural brain / emotional landscape lattice geometry
  - [ ] Orbiting particle field with custom vertex animation
  - [ ] Dynamic shader material with wave pulse frequencies
  - [ ] State transition controller:
    - [ ] `FLOW` state: Harmonious cyan-emerald waves, calm orbit
    - [ ] `GREED` state: Golden amber expansion, high-energy particle burst
    - [ ] `FEAR` state: Crimson contraction, chaotic trajectory
    - [ ] `TILT` state: Dual-tone chromatic aberration, angular displacement, erratic tumbling
  - [ ] Mouse drag / touch orbit controls and zoom bounds
  - [ ] Performance throttling: pauses rendering when Slide 3 is not active

---

### Phase 5: Interactive Slide Modules (Slides 1–10)
- [ ] **Slide 1: Anatomy of a Trade**
  - [ ] Interactive sensory map: Hoverable cognitive triggers (Prefrontal Cortex vs Amygdala)
  - [ ] Neurochemical indicator cards (Dopamine, Cortisol, Serotonin)
- [ ] **Slide 2: The Neurochemistry of Market Stress**
  - [ ] Interactive Volatility slider modulating simulated stress response
  - [ ] Live animated physiological dials: Heart rate, Cortisol level, Executive function score
- [ ] **Slide 3: The 3D Emotional Landscape**
  - [ ] Embed and link the Three.js interactive canvas
  - [ ] Interactive emotional state buttons (`FLOW`, `GREED`, `FEAR`, `TILT`) and stress sliders
- [ ] **Slide 4: Prospect Theory & Loss Aversion**
  - [ ] Interactive choice experiment ($1,000 sure gain vs 50% chance of $2,000)
  - [ ] Real-time rendered Kahneman-Tversky S-curve showing asymmetric pain of losses
- [ ] **Slide 5: The Tilt Spiral & Revenge Trading**
  - [ ] Interactive 5-stage tilt timeline
  - [ ] Interactive trade simulator where consecutive losses escalate bet size and ruin risk
- [ ] **Slide 6: Gambler's Fallacy & Recency Bias**
  - [ ] Interactive streak test: Guess the next candle/coin flip after 6 consecutive reds
  - [ ] Live empirical distribution vs true probability comparison
- [ ] **Slide 7: Law of Large Numbers & Expectancy**
  - [ ] Dynamic Expectancy Formula calculator: Win Rate $\times$ Avg Win $-$ Loss Rate $\times$ Avg Loss
  - [ ] Interactive trade sequence generator plotting outcome variance across 100 to 1,000 trades
- [ ] **Slide 8: Position Sizing & Risk of Ruin**
  - [ ] Interactive Kelly Criterion vs Fixed Fractional vs Martingale comparison
  - [ ] Dynamic equity curve chart with drawdown visualization
- [ ] **Slide 9: The Emotional Journal & Bias Diagnostic**
  - [ ] 6-question interactive self-audit assessment
  - [ ] Dynamic SVG/Canvas radar chart plotting trader profile (Impulsivity, Loss Aversion, Overconfidence, Discipline)
- [ ] **Slide 10: The Master Trader Blueprint**
  - [ ] Interactive Pre-Trade Checklist and Rulebook customizer
  - [ ] Exportable Trader Psychology Protocol (JSON / formatted summary download)

---

### Phase 6: API Integration & Client-Side Fallback Engine
- [ ] Implement `frontend/js/api-client.js`:
  - [ ] Connection health check against `http://localhost:8000/api/health`
  - [ ] Async fetch calls for Monte Carlo, Prospect Theory, and Diagnostic endpoints
  - [ ] Visual backend status indicator pill in header (`BACKEND: ONLINE` / `CLIENT FALLBACK`)
- [ ] Implement `frontend/js/simulators.js`:
  - [ ] Client-side pure JS mathematical fallback routines for all simulations
  - [ ] Smooth chart animations and SVG graph rendering without bulky external dependencies

---

### Phase 7: Polish, Quality Assurance & Verification
- [ ] Cross-browser testing and responsiveness checks (Desktop, Tablet, Mobile)
- [ ] Three.js 60fps frame rate optimization and asset cleanup
- [ ] Subtle sound effects for button clicks and state transitions (with audio mute toggle)
- [ ] Create `README.md` with complete installation, backend launch, and presentation guide
- [ ] Final user review and walkthrough
