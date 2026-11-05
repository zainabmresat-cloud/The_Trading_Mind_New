# Product Requirements Document (PRD)
## Project Name: **The Trading Mind**
### Subtitle: An Interactive Educational Exploration of Trading Psychology & Neuro-Finance

---

## 1. Executive Summary
**The Trading Mind** is an interactive, browser-based educational web presentation paired with a quantitative Python analytics engine. It demystifies the cognitive, behavioral, and neurochemical forces governing trader decisions in financial markets.

Rather than a static slide deck, **The Trading Mind** combines:
- A polished 10-slide interactive presentation engine with modern dark-terminal aesthetics.
- An animated 3D WebGL visualization built with **Three.js** depicting the emotional neural topography of a trader under market stress.
- Interactive mathematical simulations (Prospect Theory, Kelly Criterion, Tilt feedback loops).
- A Python analytics backend providing statistical modeling (Monte Carlo ruin probabilities, psychological fatigue decay, and behavioral scoring).

---

## 2. Target Audience & Educational Objectives
### 2.1 Target Audience
- Retail equity, forex, and crypto traders seeking to overcome emotional decision-making.
- Algorithmic traders and quantitative researchers studying behavioral finance anomalies.
- Financial educators and mentor communities.

### 2.2 Core Educational Takeaways
1. Understand the neurobiology of risk (cortisol, dopamine, adrenaline) during drawdowns and winning streaks.
2. Experience firsthand how Kahneman-Tversky Prospect Theory causes premature profit-taking and fatal loss-holding.
3. Master the mathematical imperative of risk management over gut prediction.
4. Diagnose personal behavioral biases through interactive live simulations and behavioral analytics.

---

## 3. Product Architecture & Technical Stack

```
+--------------------------------------------------------------------------+
|                        FRONTEND PRESENTATION LAYER                       |
|  - Modern Dark Financial Terminal Theme (CSS Glassmorphism, Neon Accents)|
|  - 10 Interactive Slides (Custom Deck Engine: Keyboard/Swipe/Controls)  |
|  - Real-time Interactive Sliders, Canvases, Dynamic Calculators          |
+--------------------------------------------------------------------------+
       |                                                    |
       v                                                    v
+-----------------------------+           +--------------------------------+
|    3D VISUALIZATION ENGINE  |           |     PYTHON ANALYTICS BACKEND   |
|  - Three.js (WebGL Canvas)  |           |  - FastAPI / Uvicorn REST API  |
|  - 3D Dynamic Brain Mesh /  |  REST /   |  - NumPy & SciPy Engine        |
|    Emotional Topography     |  JSON     |  - Monte Carlo Ruin Simulator  |
|  - State Shaders & Particles| <=======> |  - Prospect Theory Modeling    |
|  - Fear / Greed / Flow Mode |           |  - Drawdown Pain Index (Ulcer) |
+-----------------------------+           +--------------------------------+
```

### 3.1 Frontend Stack
- **HTML5**: Semantic, accessible markup for slide containers, controls, and data exhibits.
- **CSS3**: Custom design system featuring CSS Grid, Flexbox, CSS Variables, glassmorphism, glowing telemetry accents, and smooth hardware-accelerated transitions.
- **JavaScript (ES6+)**: Custom slide controller, event bus, state management, charting, and dynamic UI updates without heavy external frameworks.
- **Three.js (WebGL)**: Interactive 3D visualization representing the trader's emotional brain / risk manifold with orbit controls, particle systems, and shader-driven state transitions.

### 3.2 Backend Stack
- **Python 3.10+**: Core statistical computation runtime.
- **FastAPI / Starlette**: Lightweight, asynchronous REST API serving computational endpoints.
- **NumPy & SciPy**: Vectorized calculation of Monte Carlo simulations, distribution curves, and utility functions.
- **Pydantic**: Request/response schema validation and type safety.

---

## 4. Detailed Slide Blueprint (10 Interactive Slides)

| Slide # | Slide Title | Interactive Component | Backend / Computational Link |
| :--- | :--- | :--- | :--- |
| **01** | **The Anatomy of a Trade** | Anatomy breakdown diagram with hoverable neurochemical pulses (Dopamine vs Cortisol). | Baseline parameter initialization. |
| **02** | **The Neurochemistry of Market Stress** | Bio-feedback dashboard slider: adjust market volatility to observe simulated heart rate, cortisol spike, and cognitive impairment. | Neuro-cognitive degradation curve calculation. |
| **03** | **The 3D Emotional Landscape** *(Three.js)* | Full 3D WebGL interactive neural brain / risk manifold. User toggles emotional states (`GREED`, `FEAR`, `TILT`, `FLOW`) to watch geometry morph, shaders pulse, and particles swirl. | Real-time state parameter evaluation and shader uniforms. |
| **04** | **Prospect Theory & Loss Aversion** | Interactive Kahneman & Tversky S-curve simulator. Users test win/loss choices to measure empirical loss aversion coefficient ($\lambda \approx 2.25$). | Dynamic Prospect Theory Value Function computation. |
| **05** | **The Tilt Spiral & Revenge Trading** | Simulated 5-trade losing streak simulator showing how emotional tilt alters trade sizing, leverage, and impulse control. | Markov chain transition model of emotional state degradation. |
| **06** | **The Gambler's Fallacy & Recency Bias** | Coin-toss / market streak simulator testing user intuition vs theoretical independent probabilities. | Exact binomial distribution vs perceived probability engine. |
| **07** | **The Law of Large Numbers & Expectancy** | Interactive Expectancy Matrix ($EV = (P_{win} \times W) - (P_{loss} \times L)$) with dynamic trade distribution scatter plot. | 1,000-sample trade series generator with variable risk/reward. |
| **08** | **Position Sizing & Risk of Ruin** | Kelly Criterion vs Fixed Fractional vs Martingale comparison calculator with live equity curve generation. | Multi-path Monte Carlo probability of ruin simulation (10,000 iterations). |
| **09** | **The Emotional Journal & Bias Diagnostic** | Interactive 6-question behavioral self-assessment generating a personal "Psychological Radar Chart" and Vulnerability Score. | Bias scoring algorithm & cluster comparison against typical trader profiles. |
| **10** | **The Master Trader Blueprint** | Interactive rulebook builder, pre-flight checklist, and downloadable JSON/PDF Trading Psychology Protocol. | Plan export & session summary generation. |

---

## 5. 3D Visualization Specifications (Three.js)
- **Concept**: A holographic, rotating 3D neural brain / emotional landscape representing cognitive load.
- **Dynamic States**:
  1. **Equilibrium / Flow State**: Cyan/emerald bioluminescent glow, gentle wave oscillations, harmonic particle flow.
  2. **Greed / Euphoria**: Intense golden amber pulse, hyper-expanded particle orbits, high frequency jitter.
  3. **Panic / Fear**: Crimson red shockwaves, contractive deformation, chaotic particle dispersion.
  4. **Tilt**: Flashing dual-tone chromatic aberration, turbulent geometric spikes, erratic rotation.
- **Controls**: Interactive mouse rotation, zoom, state selection buttons, and parameter sliders (stress level, market speed).

---

## 6. Python Analytics API Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | GET | Health check and server status. |
| `/api/simulate/prospect-theory` | POST | Computes Kahneman-Tversky subjective value curve for custom gains/losses. |
| `/api/simulate/monte-carlo-ruin` | POST | Runs 1,000–5,000 path Monte Carlo simulation of account equity, max drawdown, and ruin probability based on win rate, payoff ratio, and risk percentage. |
| `/api/simulate/tilt-decay` | POST | Calculates decision quality decay curve as a function of consecutive losses and leverage. |
| `/api/analytics/diagnose-bias` | POST | Ingests user diagnostic responses and outputs bias percentiles, radar chart coordinates, and behavioral mitigation recommendations. |

---

## 7. Functional & Non-Functional Requirements
### 7.1 Functional Requirements
- Slide navigation via keyboard arrows, on-screen controls, slide thumbnail drawer, and touch swipe.
- Fullscreen mode support.
- Live data synchronization between Python backend and frontend interactive charts.
- Fallback mode: If backend is offline, frontend must seamlessly switch to embedded client-side math models with clear status indicators.

### 7.2 Non-Functional Requirements
- **Performance**: 60 FPS Three.js rendering on standard integrated GPUs; slide transitions < 300ms.
- **Cross-Browser Compatibility**: Chrome, Firefox, Safari, Edge.
- **Zero Heavy Bundler Dependency**: Pure ESM or standalone script structure for easy local execution without complex compilation pipelines.
- **Design Quality**: Luxury high-tech fintech look (deep midnight slate `#0A0E17`, electric cyan `#00F0FF`, crimson warning `#FF3366`, gold emerald `#00FFA3`).

---

## 8. Success Criteria
1. Fully functioning 10-slide interactive presentation navigating without errors.
2. Responsive and high-performance Three.js 3D visualization with interactive state switches.
3. Python FastAPI backend serving statistical simulation endpoints with valid mathematical rigor.
4. Seamless fallback client-side calculation if backend is disconnected.
5. High visual and instructional polish suitable for executive and educational demonstrations.
