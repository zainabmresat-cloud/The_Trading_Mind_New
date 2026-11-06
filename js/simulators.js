/**
 * The Trading Mind — Simulation Engine & Interactive Slide Modules
 * ================================================================
 * Provides:
 *   1. SimMath  — Pure JS mathematical models (Prospect Theory, Monte Carlo,
 *                 Tilt Decay, Expectancy, Bias Scoring).
 *   2. SimDraw  — Canvas 2D drawing utilities (S-curves, equity paths,
 *                 scatter plots, radar charts).
 *   3. Slides   — Per-slide initialisation & wiring (Slides 1–10).
 *
 * Completely offline-capable. Works with file:// protocol.
 * Uses window.ApiClient when available for backend-enhanced precision.
 *
 * Load order in index.html:
 *   three.min.js → deck.js → three-scene.js → api-client.js → simulators.js → app.js
 */

(function (global) {
  "use strict";

  /* ================================================================== */
  /*  COLOUR PALETTE — mirrors CSS custom properties                     */
  /* ================================================================== */
  var C = {
    cyan:    "#00f0ff",
    emerald: "#00ffa3",
    amber:   "#ffd600",
    crimson: "#ff3366",
    purple:  "#a855f7",
    dim:     "#64748b",
    muted:   "#94a3b8",
    dark:    "rgba(3,6,10,0.85)",
    grid:    "rgba(255,255,255,0.06)",
    axisText:"#64748b"
  };

  /* ================================================================== */
  /*  SIMMATH — pure mathematical models                                 */
  /* ================================================================== */
  var SimMath = {

    /* ---- Prospect Theory ------------------------------------------ */
    /**
     * Kahneman-Tversky value function.
     * v(x) = x^α          for x >= 0
     * v(x) = -λ(-x)^β    for x < 0
     */
    prospectValue: function (x, alpha, beta, lambda) {
      alpha  = alpha  || 0.88;
      beta   = beta   || 0.88;
      lambda = lambda || 2.25;
      if (x >= 0) {
        return Math.pow(x, alpha);
      } else {
        return -lambda * Math.pow(-x, beta);
      }
    },

    /**
     * Generate N evenly-spaced (x, v(x)) pairs over [-maxVal, maxVal].
     */
    prospectCurve: function (maxVal, nSteps, alpha, beta, lambda) {
      var step = (2 * maxVal) / nSteps;
      var pts  = [];
      for (var i = 0; i <= nSteps; i++) {
        var x = -maxVal + i * step;
        pts.push({ x: x, y: SimMath.prospectValue(x, alpha, beta, lambda) });
      }
      return pts;
    },

    /* ---- Tilt / Cognitive Decay ------------------------------------ */
    /**
     * Decision quality decays exponentially with consecutive losses.
     * Returns { quality [0–100], riskMultiplier [1+] }
     */
    tiltDecay: function (losses, leverage) {
      leverage = leverage || 1;
      var decayRate    = 0.18;
      var quality      = 100 * Math.exp(-decayRate * losses * leverage);
      quality          = Math.max(5, Math.min(100, quality));
      var riskMult     = 1 + 0.22 * losses * Math.sqrt(leverage);
      return {
        quality:        Math.round(quality * 10) / 10,
        riskMultiplier: Math.round(riskMult * 100) / 100
      };
    },

    /* ---- Expectancy ----------------------------------------------- */
    /**
     * EV per unit risked.
     * winRate in [0,1], rr = avg-win / avg-loss
     */
    expectancy: function (winRate, rr) {
      var lossRate = 1 - winRate;
      return winRate * rr - lossRate * 1;
    },

    breakEvenWinRate: function (rr) {
      return 1 / (1 + rr);
    },

    /* ---- Monte Carlo Ruin ----------------------------------------- */
    /**
     * Simulate nPaths equity curves of nTrades trades each.
     * Returns { paths, ruinProbability, medianFinal, kellyFraction }
     * riskPct is fraction of equity risked per trade (e.g. 0.02 for 2%)
     * ruinThreshold — equity fraction at which a path is considered ruined.
     */
    monteCarlo: function (winRate, rr, riskPct, nPaths, nTrades, ruinThreshold) {
      nPaths        = nPaths        || 50;
      nTrades       = nTrades       || 100;
      ruinThreshold = ruinThreshold || 0.5;   // 50% drawdown = ruin

      var paths       = [];
      var ruinCount   = 0;
      var finalEquities = [];

      for (var p = 0; p < nPaths; p++) {
        var equity = 1.0;
        var curve  = [equity];
        var ruined = false;

        for (var t = 0; t < nTrades; t++) {
          var r = Math.random();
          if (r < winRate) {
            equity *= (1 + riskPct * rr);
          } else {
            equity *= (1 - riskPct);
          }
          if (equity <= ruinThreshold && !ruined) {
            ruined = true;
            ruinCount++;
          }
          curve.push(equity);
        }
        paths.push({ curve: curve, ruined: ruined });
        finalEquities.push(equity);
      }

      finalEquities.sort(function (a, b) { return a - b; });
      var midIdx = Math.floor(finalEquities.length / 2);

      // Full Kelly: f* = p - q/b  where b = rr
      var q = 1 - winRate;
      var kelly = Math.max(0, (winRate - q / rr));

      return {
        paths:            paths,
        ruinProbability:  Math.round((ruinCount / nPaths) * 1000) / 10,
        medianFinal:      Math.round(finalEquities[midIdx] * 1000) / 10,
        kellyFraction:    Math.round(kelly * 1000) / 10
      };
    },

    /* ---- Trade Scatter -------------------------------------------- */
    /**
     * Simulate nTrades, return cumulative P&L array in R-units.
     */
    tradeScatter: function (winRate, rr, nTrades) {
      nTrades = nTrades || 200;
      var cumulative = [0];
      for (var i = 0; i < nTrades; i++) {
        var last = cumulative[cumulative.length - 1];
        if (Math.random() < winRate) {
          cumulative.push(last + rr);
        } else {
          cumulative.push(last - 1);
        }
      }
      return cumulative;
    },

    /* ---- Stress Bio-Feedback -------------------------------------- */
    /**
     * Compute simulated physiological metrics from volatility and drawdown.
     * volatility: VIX proxy [10–80]
     * drawdown:   open position drawdown [0–30]%
     */
    stressMetrics: function (volatility, drawdown) {
      var stressIndex  = (volatility / 80) * 0.6 + (drawdown / 30) * 0.4;
      stressIndex      = Math.min(1, Math.max(0, stressIndex));

      var heartRate    = Math.round(72 + stressIndex * 68);       // 72–140 BPM
      var cortisol     = Math.round((14.2 + stressIndex * 25.8) * 10) / 10; // 14–40 µg/dL
      var execFunction = Math.round((92 - stressIndex * 72) * 10) / 10;     // 92–20%

      var phase, phaseDesc, phaseColor;
      if (stressIndex < 0.25) {
        phase      = "OPTIMAL FLOW STATE";
        phaseDesc  = "Prefrontal cortex maintains full executive governance. Risk calculations remain objective and disciplined.";
        phaseColor = C.cyan;
      } else if (stressIndex < 0.5) {
        phase      = "ELEVATED ALERT MODE";
        phaseDesc  = "Mild sympathetic activation. Decision latency increases 15–20%. Watch for confirmation bias.";
        phaseColor = C.amber;
      } else if (stressIndex < 0.75) {
        phase      = "ACUTE STRESS RESPONSE";
        phaseDesc  = "Cortisol flooding prefrontal cortex. Cognitive tunnel vision active. High risk of stop-loss removal.";
        phaseColor = C.amber;
      } else {
        phase      = "TILT / FIGHT-OR-FLIGHT";
        phaseDesc  = "Amygdala hijack in progress. Executive function critically impaired. Close all positions and step away.";
        phaseColor = C.crimson;
      }

      return { heartRate: heartRate, cortisol: cortisol, execFunction: execFunction,
               phase: phase, phaseDesc: phaseDesc, phaseColor: phaseColor,
               stressIndex: stressIndex };
    },

    /* ---- Bias Diagnostic Scoring ---------------------------------- */
    /**
     * answers: { q1, q2, q3, q4, q5, q6 } each in [1,5]
     * Returns { scores (6 dims), vulnerabilityScore, archetype }
     */
    scoreBias: function (answers) {
      var q1 = answers.q1 || 3,
          q2 = answers.q2 || 3,
          q3 = answers.q3 || 3,
          q4 = answers.q4 || 3,
          q5 = answers.q5 || 3,
          q6 = answers.q6 || 3;

      // Map questions to 6 dimensions
      var dims = {
        "Loss Aversion":    Math.round(((q1 * 0.6 + q2 * 0.4) / 5) * 100),
        "Impulsivity":      Math.round(((q3 * 0.7 + q4 * 0.3) / 5) * 100),
        "Overconfidence":   Math.round(((q4 * 0.5 + q5 * 0.3 + (6 - q1) * 0.2) / 5) * 100),
        "Recency Bias":     Math.round(((q5 * 0.7 + q6 * 0.3) / 5) * 100),
        "FOMO":             Math.round(((q6 * 0.6 + q3 * 0.4) / 5) * 100),
        "Discipline":       Math.round((((6 - q1) * 0.3 + (6 - q3) * 0.4 + (6 - q4) * 0.3) / 5) * 100)
      };

      var total = 0, count = 0;
      for (var k in dims) { total += dims[k]; count++; }
      var vuln = Math.round(total / count);

      var archetype, archetypeDesc;
      var maxDim = "Loss Aversion", maxVal = dims["Loss Aversion"];
      for (var d in dims) {
        if (dims[d] > maxVal) { maxVal = dims[d]; maxDim = d; }
      }

      var archetypes = {
        "Loss Aversion":  { name: "THE ASYMMETRIC BLEEDER",    desc: "Severe disposition bias: holds losing positions 3× longer than winning targets." },
        "Impulsivity":    { name: "THE REVENGE TRADER",        desc: "High impulsivity: re-enters immediately after losses, escalating size." },
        "Overconfidence": { name: "THE EUPHORIC OVEREXTENDER", desc: "Winning streaks create dangerous illusion of invincibility. Sizing explodes." },
        "Recency Bias":   { name: "THE PATTERN GHOST-CHASER",  desc: "Extrapolates recent market moves into permanent regime shifts." },
        "FOMO":           { name: "THE SIGNAL-CHASER",         desc: "Persistent fear of missing out causes late, over-priced entries." },
        "Discipline":     { name: "THE RULES-OPTIONAL TRADER", desc: "Treats written trading plan as advisory. Breaks rules when emotions peak." }
      };

      var arc = archetypes[maxDim] || archetypes["Loss Aversion"];
      return {
        scores:           dims,
        vulnerabilityScore: vuln,
        archetype:        arc.name,
        archetypeDesc:    arc.desc,
        dominantBias:     maxDim
      };
    }

  }; // end SimMath

  /* ================================================================== */
  /*  SIMDRAW — Canvas 2D Drawing Engine                                */
  /* ================================================================== */
  var SimDraw = {

    /* ---- Internal helpers ----------------------------------------- */

    _dpr: function () { return window.devicePixelRatio || 1; },

    /**
     * Ensure a <canvas> fills its container at correct pixel density.
     * Returns the 2D context.
     */
    _ensureCanvas: function (container, minH) {
      minH = minH || 260;
      var existing = container.querySelector("canvas");
      var canvas   = existing || document.createElement("canvas");
      if (!existing) {
        canvas.style.position = "absolute";
        canvas.style.inset    = "0";
        canvas.style.width    = "100%";
        canvas.style.height   = "100%";
        container.style.position = container.style.position || "relative";
        // Clear placeholder text
        container.innerHTML = "";
        container.appendChild(canvas);
      }
      var dpr = this._dpr();
      var w   = container.offsetWidth  || 480;
      var h   = Math.max(container.offsetHeight || minH, minH);
      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      var ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx._w = w;
      ctx._h = h;
      return ctx;
    },

    _clear: function (ctx) {
      ctx.clearRect(0, 0, ctx._w, ctx._h);
      ctx.fillStyle = "rgba(3,6,10,0.0)";
      ctx.fillRect(0, 0, ctx._w, ctx._h);
    },

    _gridLines: function (ctx, ox, oy, plotW, plotH, nX, nY) {
      ctx.strokeStyle = C.grid;
      ctx.lineWidth   = 1;
      for (var i = 0; i <= nX; i++) {
        var x = ox + (i / nX) * plotW;
        ctx.beginPath(); ctx.moveTo(x, oy); ctx.lineTo(x, oy + plotH); ctx.stroke();
      }
      for (var j = 0; j <= nY; j++) {
        var y = oy + (j / nY) * plotH;
        ctx.beginPath(); ctx.moveTo(ox, y); ctx.lineTo(ox + plotW, y); ctx.stroke();
      }
    },

    _axes: function (ctx, ox, oy, plotW, plotH) {
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.moveTo(ox, oy); ctx.lineTo(ox, oy + plotH);
      ctx.moveTo(ox, oy + plotH); ctx.lineTo(ox + plotW, oy + plotH);
      ctx.stroke();
    },

    _label: function (ctx, text, x, y, color, size, align) {
      ctx.fillStyle    = color || C.axisText;
      ctx.font         = "bold " + (size || 10) + "px JetBrains Mono, monospace";
      ctx.textAlign    = align || "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, x, y);
    },

    /* ---- 1. Prospect Theory S-Curve ------------------------------- */
    drawProspectCurve: function (container) {
      var ctx    = this._ensureCanvas(container, 260);
      var W      = ctx._w, H = ctx._h;
      var pad    = { top: 20, right: 20, bottom: 40, left: 55 };
      var plotW  = W - pad.left - pad.right;
      var plotH  = H - pad.top  - pad.bottom;
      var ox     = pad.left, oy = pad.top;

      this._clear(ctx);
      this._gridLines(ctx, ox, oy, plotW, plotH, 8, 6);

      // Data — prospect curve from -1 to +1 (normalised)
      var maxX    = 1.0;
      var maxY    = 2.25; // lambda * 1^0.88
      var pts     = SimMath.prospectCurve(maxX, 120, 0.88, 0.88, 2.25);

      // Map (x,y) -> canvas coords
      var toCanvasX = function (x) { return ox + ((x + maxX) / (2 * maxX)) * plotW; };
      var toCanvasY = function (y) { return oy + plotH / 2 - (y / maxY) * (plotH / 2); };

      // Zero axis (horizontal)
      var midY = oy + plotH / 2;
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth   = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(ox, midY); ctx.lineTo(ox + plotW, midY); ctx.stroke();
      ctx.setLineDash([]);

      // Zero axis (vertical)
      var midX = ox + plotW / 2;
      ctx.beginPath(); ctx.moveTo(midX, oy); ctx.lineTo(midX, oy + plotH); ctx.stroke();

      // Draw GAIN side (x >= 0) in cyan
      ctx.strokeStyle = C.cyan;
      ctx.lineWidth   = 2.5;
      ctx.shadowBlur  = 8;
      ctx.shadowColor = C.cyan;
      ctx.beginPath();
      var started = false;
      for (var i = 0; i < pts.length; i++) {
        if (pts[i].x < 0) continue;
        var cx = toCanvasX(pts[i].x);
        var cy = toCanvasY(pts[i].y);
        if (!started) { ctx.moveTo(cx, cy); started = true; }
        else ctx.lineTo(cx, cy);
      }
      ctx.stroke();

      // Draw LOSS side (x < 0) in crimson
      ctx.strokeStyle = C.crimson;
      ctx.shadowColor = C.crimson;
      ctx.beginPath();
      started = false;
      for (var j = 0; j < pts.length; j++) {
        if (pts[j].x > 0) continue;
        var lcx = toCanvasX(pts[j].x);
        var lcy = toCanvasY(pts[j].y);
        if (!started) { ctx.moveTo(lcx, lcy); started = true; }
        else ctx.lineTo(lcx, lcy);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Reference 45° line (symmetric would look like)
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth   = 1;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(toCanvasX(-maxX), toCanvasY(-maxY * 0.44));
      ctx.lineTo(toCanvasX(maxX),  toCanvasY(maxY * 0.44));
      ctx.stroke();
      ctx.setLineDash([]);

      // Axes
      this._axes(ctx, ox, oy, plotW, plotH);

      // Labels
      this._label(ctx, "GAIN DOMAIN", ox + plotW * 0.78, oy + 14, C.cyan, 9);
      this._label(ctx, "LOSS DOMAIN", ox + plotW * 0.22, oy + plotH - 10, C.crimson, 9);
      this._label(ctx, "v(x)", ox - 36, oy + plotH / 2, C.muted, 9, "center");
      this._label(ctx, "outcome x", ox + plotW / 2, oy + plotH + 28, C.muted, 9);
      this._label(ctx, "λ = 2.25", ox + plotW * 0.15, midY + 32, C.amber, 9);
    },

    /* ---- 2. Trade Scatter (Slide 7) ------------------------------- */
    drawTradeScatter: function (container, winRate, rr, nTrades) {
      winRate = winRate || 0.45;
      rr      = rr      || 2.0;
      nTrades = nTrades || 200;

      var ctx    = this._ensureCanvas(container, 240);
      var W      = ctx._w, H = ctx._h;
      var pad    = { top: 20, right: 20, bottom: 36, left: 55 };
      var plotW  = W - pad.left - pad.right;
      var plotH  = H - pad.top  - pad.bottom;
      var ox     = pad.left, oy = pad.top;

      var cumulative = SimMath.tradeScatter(winRate, rr, nTrades);
      var minPL = Math.min.apply(null, cumulative);
      var maxPL = Math.max.apply(null, cumulative);
      var range = maxPL - minPL || 1;

      var toX = function (i) { return ox + (i / nTrades) * plotW; };
      var toY = function (pl) { return oy + plotH - ((pl - minPL) / range) * plotH; };

      this._clear(ctx);
      this._gridLines(ctx, ox, oy, plotW, plotH, 8, 5);
      this._axes(ctx, ox, oy, plotW, plotH);

      // Zero line
      var zeroY = toY(0);
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth   = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(ox, zeroY); ctx.lineTo(ox + plotW, zeroY); ctx.stroke();
      ctx.setLineDash([]);

      // Individual trade dots
      for (var i = 1; i <= nTrades; i++) {
        var delta = cumulative[i] - cumulative[i - 1];
        var dotColor = delta > 0 ? C.emerald : C.crimson;
        ctx.fillStyle = dotColor;
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.arc(toX(i), toY(cumulative[i]), 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Cumulative equity line
      ctx.strokeStyle = C.cyan;
      ctx.lineWidth   = 2;
      ctx.shadowBlur  = 8;
      ctx.shadowColor = C.cyan;
      ctx.beginPath();
      ctx.moveTo(toX(0), toY(0));
      for (var k = 1; k <= nTrades; k++) {
        ctx.lineTo(toX(k), toY(cumulative[k]));
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // EV line (expected drift)
      var ev = SimMath.expectancy(winRate, rr);
      ctx.strokeStyle = C.amber;
      ctx.lineWidth   = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(toX(0), toY(0));
      ctx.lineTo(toX(nTrades), toY(ev * nTrades));
      ctx.stroke();
      ctx.setLineDash([]);

      this._label(ctx, "CUMUL P&L (R)", ox - 42, oy + plotH / 2, C.muted, 9);
      this._label(ctx, "TRADES", ox + plotW / 2, oy + plotH + 26, C.muted, 9);
      this._label(ctx, "EV drift", ox + plotW - 28, toY(ev * nTrades) - 10, C.amber, 8);
    },

    /* ---- 3. Monte Carlo Equity Paths (Slide 8) -------------------- */
    drawEquityPaths: function (container, winRate, rr, riskPct, nPaths, nTrades) {
      winRate = winRate || 0.45;
      rr      = rr      || 2.0;
      riskPct = riskPct || 0.02;
      nPaths  = nPaths  || 60;
      nTrades = nTrades || 100;

      var result = SimMath.monteCarlo(winRate, rr, riskPct, nPaths, nTrades);
      var paths  = result.paths;

      var ctx    = this._ensureCanvas(container, 240);
      var W      = ctx._w, H = ctx._h;
      var pad    = { top: 20, right: 20, bottom: 36, left: 55 };
      var plotW  = W - pad.left - pad.right;
      var plotH  = H - pad.top  - pad.bottom;
      var ox     = pad.left, oy = pad.top;

      // Find global range
      var allVals = [];
      for (var p = 0; p < paths.length; p++) {
        for (var t = 0; t < paths[p].curve.length; t++) {
          allVals.push(paths[p].curve[t]);
        }
      }
      var minE = Math.min.apply(null, allVals);
      var maxE = Math.max.apply(null, allVals);
      var rng  = maxE - minE || 1;

      var toX = function (i) { return ox + (i / nTrades) * plotW; };
      var toY = function (e) { return oy + plotH - ((e - minE) / rng) * plotH; };

      this._clear(ctx);
      this._gridLines(ctx, ox, oy, plotW, plotH, 8, 5);
      this._axes(ctx, ox, oy, plotW, plotH);

      // Ruin threshold line at 0.5
      var ruinY = toY(0.5);
      ctx.strokeStyle = "rgba(255,51,102,0.4)";
      ctx.lineWidth   = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(ox, ruinY); ctx.lineTo(ox + plotW, ruinY); ctx.stroke();
      ctx.setLineDash([]);
      this._label(ctx, "RUIN (-50%)", ox + 4, ruinY - 8, C.crimson, 8, "left");

      // Draw each path
      for (var pi = 0; pi < paths.length; pi++) {
        var curve   = paths[pi].curve;
        var isRuined = paths[pi].ruined;
        ctx.strokeStyle = isRuined
          ? "rgba(255,51,102,0.3)"
          : "rgba(0,240,255,0.15)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(toX(0), toY(curve[0]));
        for (var ti = 1; ti < curve.length; ti++) {
          ctx.lineTo(toX(ti), toY(curve[ti]));
        }
        ctx.stroke();
      }

      // Median path — bright cyan
      var medianCurve = [];
      for (var mi = 0; mi <= nTrades; mi++) {
        var vals = [];
        for (var mpi = 0; mpi < paths.length; mpi++) {
          if (paths[mpi].curve[mi] !== undefined) vals.push(paths[mpi].curve[mi]);
        }
        vals.sort(function (a, b) { return a - b; });
        medianCurve.push(vals[Math.floor(vals.length / 2)] || 1);
      }
      ctx.strokeStyle = C.cyan;
      ctx.lineWidth   = 2.5;
      ctx.shadowBlur  = 10;
      ctx.shadowColor = C.cyan;
      ctx.beginPath();
      ctx.moveTo(toX(0), toY(medianCurve[0]));
      for (var mk = 1; mk <= nTrades; mk++) {
        ctx.lineTo(toX(mk), toY(medianCurve[mk]));
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Start line
      var startY = toY(1.0);
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth   = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(ox, startY); ctx.lineTo(ox + plotW, startY); ctx.stroke();
      ctx.setLineDash([]);

      this._label(ctx, "EQUITY", ox - 40, oy + plotH / 2, C.muted, 9);
      this._label(ctx, "TRADES", ox + plotW / 2, oy + plotH + 26, C.muted, 9);

      return result;
    },

    /* ---- 4. Radar Chart (Slide 9) --------------------------------- */
    drawRadarChart: function (container, scores) {
      // scores: { dimName: value[0-100], ... }  (6 dims)
      var ctx  = this._ensureCanvas(container, 240);
      var W    = ctx._w, H = ctx._h;
      var cx   = W / 2, cy = H / 2;
      var R    = Math.min(W, H) * 0.38;

      this._clear(ctx);

      var labels = Object.keys(scores);
      var vals   = labels.map(function (k) { return (scores[k] || 0) / 100; });
      var n      = labels.length;

      var angleOf = function (i) { return (i / n) * Math.PI * 2 - Math.PI / 2; };
      var ptX     = function (i, r) { return cx + Math.cos(angleOf(i)) * r; };
      var ptY     = function (i, r) { return cy + Math.sin(angleOf(i)) * r; };

      // Background rings
      var rings = [0.25, 0.5, 0.75, 1.0];
      rings.forEach(function (frac) {
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth   = 1;
        ctx.beginPath();
        for (var i = 0; i < n; i++) {
          var px = ptX(i, R * frac), py = ptY(i, R * frac);
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      });

      // Axis spokes
      for (var ai = 0; ai < n; ai++) {
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ptX(ai, R), ptY(ai, R));
        ctx.stroke();
      }

      // Fill polygon (user scores)
      ctx.fillStyle   = "rgba(0,240,255,0.12)";
      ctx.strokeStyle = C.cyan;
      ctx.lineWidth   = 2;
      ctx.shadowBlur  = 12;
      ctx.shadowColor = C.cyan;
      ctx.beginPath();
      for (var si = 0; si < n; si++) {
        var px = ptX(si, R * vals[si]), py = ptY(si, R * vals[si]);
        if (si === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Data point dots
      for (var di = 0; di < n; di++) {
        ctx.fillStyle = C.cyan;
        ctx.beginPath();
        ctx.arc(ptX(di, R * vals[di]), ptY(di, R * vals[di]), 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Labels — push outward
      ctx.font = "bold 10px JetBrains Mono, monospace";
      for (var li = 0; li < n; li++) {
        var angle  = angleOf(li);
        var labelR = R + 22;
        var lx     = cx + Math.cos(angle) * labelR;
        var ly     = cy + Math.sin(angle) * labelR;
        var align  = Math.cos(angle) > 0.3 ? "left" : Math.cos(angle) < -0.3 ? "right" : "center";
        ctx.fillStyle    = C.muted;
        ctx.textAlign    = align;
        ctx.textBaseline = "middle";
        // Wrap long label onto two lines
        var parts = labels[li].split(" ");
        if (parts.length > 1) {
          ctx.fillText(parts[0], lx, ly - 7);
          ctx.fillText(parts.slice(1).join(" "), lx, ly + 7);
        } else {
          ctx.fillText(labels[li], lx, ly);
        }
        // Score %
        ctx.fillStyle = C.cyan;
        ctx.font      = "bold 9px JetBrains Mono, monospace";
        ctx.fillText(Math.round(vals[li] * 100) + "%", lx, ly + (parts.length > 1 ? 20 : 14));
        ctx.font = "bold 10px JetBrains Mono, monospace";
      }
    }

  }; // end SimDraw

  /* ================================================================== */
  /*  SLIDES — per-slide initialisation & wiring                        */
  /* ================================================================== */
  var Slides = {

    _initialized: {},  // tracks which slides have been init'd

    /* -- Slide 1: Anatomy of a Trade -------------------------------- */
    initSlide1: function () {
      // Add subtle hover glow to the brain-region stat-boxes
      var slide = document.getElementById("slide-1");
      if (!slide) return;
      var boxes = slide.querySelectorAll(".stat-box");
      boxes.forEach(function (box) {
        box.style.transition = "border-color 0.3s ease, box-shadow 0.3s ease";
        box.addEventListener("mouseenter", function () {
          box.style.borderColor = C.cyan;
          box.style.boxShadow   = "0 0 14px rgba(0,240,255,0.2)";
        });
        box.addEventListener("mouseleave", function () {
          box.style.borderColor = "";
          box.style.boxShadow   = "";
        });
      });

      // Animated neurochemical telemetry ticker
      var logs = slide.querySelectorAll(".terminal-logs div");
      var idx  = 0;
      setInterval(function () {
        logs.forEach(function (l) { l.style.opacity = "0.5"; });
        if (logs[idx]) { logs[idx].style.opacity = "1"; }
        idx = (idx + 1) % logs.length;
      }, 2200);
    },

    /* -- Slide 2: Neurochemistry of Market Stress ------------------- */
    initSlide2: function () {
      var slide = document.getElementById("slide-2");
      if (!slide) return;

      var sliderVol  = document.getElementById("slider-volatility");
      var sliderDD   = document.getElementById("slider-drawdown");
      var valVol     = document.getElementById("slider-volatility-val");
      var valDD      = document.getElementById("slider-drawdown-val");
      var hrEl       = document.getElementById("stat-heart-rate");
      var cortisolEl = document.getElementById("stat-cortisol");
      var execEl     = document.getElementById("stat-executive");
      var phaseTitle = document.getElementById("stress-phase-title");
      var phaseDesc  = document.getElementById("stress-phase-desc");
      var phaseBox   = document.getElementById("stress-phase-indicator");

      if (!sliderVol || !sliderDD) return;

      function update() {
        var vol = parseFloat(sliderVol.value);
        var dd  = parseFloat(sliderDD.value);
        if (valVol) valVol.textContent = vol.toFixed(1) + " pts";
        if (valDD)  valDD.textContent  = "-" + dd.toFixed(1) + "%";

        var m = SimMath.stressMetrics(vol, dd);

        if (hrEl)       { hrEl.textContent  = m.heartRate + " BPM";
                          hrEl.className     = "stat-value " + (m.heartRate > 110 ? "crimson" : m.heartRate > 90 ? "amber" : "cyan"); }
        if (cortisolEl) { cortisolEl.textContent = m.cortisol + " µg/dL";
                          cortisolEl.className    = "stat-value " + (m.cortisol > 25 ? "crimson" : m.cortisol > 18 ? "amber" : "emerald"); }
        if (execEl)     { execEl.textContent = m.execFunction.toFixed(1) + "%";
                          execEl.className   = "stat-value " + (m.execFunction < 40 ? "crimson" : m.execFunction < 70 ? "amber" : "emerald"); }

        if (phaseTitle) phaseTitle.textContent = m.phase;
        if (phaseDesc)  phaseDesc.textContent  = m.phaseDesc;
        if (phaseBox)   phaseBox.style.borderColor = m.phaseColor;

        // Colour the phase title
        if (phaseTitle) phaseTitle.style.color = m.phaseColor;
      }

      sliderVol.addEventListener("input", update);
      sliderDD.addEventListener("input", update);
      update();
    },

    /* -- Slide 3: 3D Emotional Landscape ---------------------------- */
    initSlide3: function () {
      var slide = document.getElementById("slide-3");
      if (!slide) return;

      // Wire pill buttons to ThreeScene
      var pills = slide.querySelectorAll(".pill-option");
      var hudEl = document.getElementById("three-hud-state");

      pills.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var state = btn.dataset.state;
          pills.forEach(function (p) { p.classList.remove("active"); });
          btn.classList.add("active");
          if (hudEl) {
            var labels = { FLOW: "EQUILIBRIUM (FLOW)", GREED: "EUPHORIA / GREED",
                           FEAR: "PANIC / FEAR",       TILT:  "TILT DISRUPTION" };
            hudEl.textContent = labels[state] || state;
          }
          if (global.ThreeScene && global.ThreeScene.setState) {
            global.ThreeScene.setState(state);
          }
        });
      });
    },

    /* -- Slide 4: Prospect Theory & Loss Aversion ------------------- */
    initSlide4: function () {
      var slide = document.getElementById("slide-4");
      if (!slide) return;

      // Draw the S-curve
      var container = document.getElementById("prospect-chart-container");
      if (container) SimDraw.drawProspectCurve(container);

      // Wire choice experiment buttons
      var buttons = slide.querySelectorAll(".btn-group .btn-ghost");
      var resultEl = document.getElementById("prospect-experiment-result");
      var choiceLog = [];

      buttons.forEach(function (btn, i) {
        btn.addEventListener("click", function () {
          var text = btn.textContent.trim();
          var isCertain = text.indexOf("100%") !== -1;
          var isGain    = text.indexOf("+") !== -1;

          // Log and highlight chosen button
          buttons.forEach(function (b) { b.classList.remove("btn-primary"); });
          btn.classList.add("btn-primary");
          choiceLog.push({ text: text, bias: isCertain && isGain ? "Risk Averse" : !isCertain && !isGain ? "Risk Seeking" : "Neutral" });

          if (resultEl) {
            var msg;
            if (isCertain && isGain) {
              msg = "✓ RISK AVERSE in gains — classic Prospect Theory pattern. You locked in the sure profit.";
              resultEl.style.borderColor = C.amber;
              resultEl.style.color = C.amber;
            } else if (!isCertain && !isGain) {
              msg = "✓ RISK SEEKING in losses — classic Disposition Anomaly. You gambled to avoid realising the loss.";
              resultEl.style.borderColor = C.crimson;
              resultEl.style.color = C.crimson;
            } else {
              msg = "→ Your response is recorded. Try the other scenario to complete the full bias fingerprint.";
              resultEl.style.borderColor = C.cyan;
              resultEl.style.color = C.cyan;
            }
            resultEl.textContent = msg;
            resultEl.style.display = "block";
          }
        });
      });
    },

    /* -- Slide 5: Tilt Spiral & Revenge Trading --------------------- */
    initSlide5: function () {
      var slide = document.getElementById("slide-5");
      if (!slide) return;

      var slider    = document.getElementById("slider-tilt-losses");
      var valEl     = document.getElementById("slider-tilt-losses-val");
      var qualityEl = document.getElementById("stat-tilt-quality");
      var riskEl    = document.getElementById("stat-tilt-risk-mult");

      if (!slider) return;

      function update() {
        var losses = parseInt(slider.value, 10);
        if (valEl) valEl.textContent = losses + (losses === 1 ? " Loss" : " Losses");

        var result = SimMath.tiltDecay(losses, 1);

        if (qualityEl) {
          qualityEl.textContent = result.quality + "%";
          qualityEl.className   = "stat-value " +
            (result.quality < 40 ? "crimson" : result.quality < 70 ? "amber" : "cyan");
        }
        if (riskEl) {
          riskEl.textContent = result.riskMultiplier + "x";
          riskEl.className   = "stat-value " +
            (result.riskMultiplier > 2.5 ? "crimson" : result.riskMultiplier > 1.5 ? "amber" : "emerald");
        }

        // Optionally fetch from backend for a richer decay curve
        if (global.ApiClient && global.ApiClient.online) {
          global.ApiClient.tiltDecay({ consecutive_losses: losses, leverage: 1 }, function (err, data) {
            if (!err && data) {
              if (qualityEl && data.decision_quality !== undefined) {
                qualityEl.textContent = (data.decision_quality * 100).toFixed(1) + "%";
              }
              if (riskEl && data.risk_multiplier !== undefined) {
                riskEl.textContent = data.risk_multiplier.toFixed(2) + "x";
              }
            }
          });
        }
      }

      slider.addEventListener("input", update);
      update();
    },

    /* -- Slide 6: Gambler's Fallacy & Recency Bias ------------------ */
    initSlide6: function () {
      var slide = document.getElementById("slide-6");
      if (!slide) return;

      // Find the interactive streak test container
      var streakContainer = document.getElementById("s6-streak-container");
      if (!streakContainer) return;

      var history   = [];
      var predChoiceEl  = document.getElementById("s6-pred-choice");
      var historyEl     = document.getElementById("s6-history-row");
      var resultEl      = document.getElementById("s6-flip-result");
      var statsEl       = document.getElementById("s6-flip-stats");
      var predButtons   = streakContainer.querySelectorAll(".s6-pred-btn");
      var flipBtn       = document.getElementById("s6-flip-btn");

      var predChosen = null;
      var correctCount = 0, totalFlips = 0;

      function renderHistory() {
        if (!historyEl) return;
        historyEl.innerHTML = "";
        var last = history.slice(-10);
        last.forEach(function (outcome, i) {
          var div = document.createElement("div");
          div.style.cssText = "width:30px;height:30px;border-radius:4px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.8rem;border:1.5px solid " +
            (outcome === "UP" ? C.emerald : C.crimson) + ";background:" +
            (outcome === "UP" ? "rgba(0,255,163,0.15)" : "rgba(255,51,102,0.15)") + ";color:" +
            (outcome === "UP" ? C.emerald : C.crimson);
          div.textContent = outcome === "UP" ? "▲" : "▼";
          historyEl.appendChild(div);
        });
        // Question mark for next
        var qDiv = document.createElement("div");
        qDiv.style.cssText = "width:30px;height:30px;border-radius:4px;display:flex;align-items:center;justify-content:center;font-weight:700;border:1.5px dashed " + C.cyan + ";color:" + C.cyan;
        qDiv.textContent = "?";
        historyEl.appendChild(qDiv);
      }

      predButtons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          predChosen = btn.dataset.pred;
          predButtons.forEach(function (b) { b.style.borderColor = ""; b.style.boxShadow = ""; });
          btn.style.borderColor = C.amber;
          btn.style.boxShadow   = "0 0 10px rgba(255,214,0,0.3)";
        });
      });

      if (flipBtn) {
        flipBtn.addEventListener("click", function () {
          var outcome = Math.random() < 0.5 ? "UP" : "DOWN";
          history.push(outcome);
          totalFlips++;

          if (predChosen !== null) {
            if (predChosen === outcome) correctCount++;
          }

          renderHistory();

          if (resultEl) {
            var correct = predChosen === outcome;
            resultEl.textContent = "Result: " + (outcome === "UP" ? "▲ UP" : "▼ DOWN") +
              (predChosen ? (correct ? " — Correct!" : " — Wrong.") : "");
            resultEl.style.color = outcome === "UP" ? C.emerald : C.crimson;
          }

          if (statsEl && totalFlips > 0) {
            var pct = predChosen ? Math.round((correctCount / totalFlips) * 100) : "—";
            statsEl.textContent = "Your accuracy: " + (predChosen ? pct + "% over " + totalFlips + " flips" : "Make a prediction first") +
              " | True probability: 50.0%";
          }

          predChosen = null;
          predButtons.forEach(function (b) { b.style.borderColor = ""; b.style.boxShadow = ""; });
        });
      }

      renderHistory();
    },

    /* -- Slide 7: Law of Large Numbers & Expectancy ----------------- */
    initSlide7: function () {
      var slide = document.getElementById("slide-7");
      if (!slide) return;

      var sliderWR = document.getElementById("slider-expectancy-winrate");
      var sliderRR = document.getElementById("slider-expectancy-rr");
      var valWR    = document.getElementById("slider-expectancy-winrate-val");
      var valRR    = document.getElementById("slider-expectancy-rr-val");
      var evEl     = document.getElementById("stat-ev-value");
      var ev100El  = document.getElementById("stat-ev-100");
      var beEl     = document.getElementById("stat-ev-breakeven");
      var container = document.getElementById("expectancy-chart-container");

      if (!sliderWR || !sliderRR) return;

      function update() {
        var wr   = parseInt(sliderWR.value, 10) / 100;
        var rr   = parseFloat(sliderRR.value);
        var ev   = SimMath.expectancy(wr, rr);
        var be   = SimMath.breakEvenWinRate(rr);

        if (valWR) valWR.textContent = Math.round(wr * 100) + "%";
        if (valRR) valRR.textContent = rr.toFixed(1) + " : 1";
        if (evEl) {
          evEl.textContent = (ev >= 0 ? "+" : "") + ev.toFixed(3) + " R";
          evEl.className   = "stat-value " + (ev > 0 ? "emerald" : ev < 0 ? "crimson" : "amber");
        }
        if (ev100El) {
          var e100 = ev * 100;
          ev100El.textContent = (e100 >= 0 ? "+" : "") + e100.toFixed(1) + " R";
          ev100El.className   = "stat-value " + (e100 > 0 ? "cyan" : "crimson");
        }
        if (beEl) {
          beEl.textContent = (be * 100).toFixed(1) + "%";
          beEl.className   = "stat-value " + (wr >= be ? "emerald" : "crimson");
        }

        if (container) SimDraw.drawTradeScatter(container, wr, rr, 200);
      }

      sliderWR.addEventListener("input", update);
      sliderRR.addEventListener("input", update);
      update();
    },

    /* -- Slide 8: Position Sizing & Risk of Ruin -------------------- */
    initSlide8: function () {
      var slide = document.getElementById("slide-8");
      if (!slide) return;

      var sliderWR   = document.getElementById("s8-slider-wr");
      var sliderRisk = document.getElementById("s8-slider-risk");
      var valWR      = document.getElementById("s8-val-wr");
      var valRisk    = document.getElementById("s8-val-risk");
      var ruinEl     = document.getElementById("stat-ruin-prob");
      var kellyEl    = document.getElementById("stat-ruin-kelly");
      var recEl      = document.getElementById("stat-ruin-rec");
      var container  = document.getElementById("ruin-chart-container");

      if (!sliderWR || !sliderRisk) return;

      function update() {
        var wr      = parseInt(sliderWR.value, 10) / 100;
        var riskPct = parseFloat(sliderRisk.value) / 100;
        var rr      = 2.0; // fixed R:R for position sizing demo

        if (valWR)   valWR.textContent   = Math.round(wr * 100) + "%";
        if (valRisk) valRisk.textContent = (riskPct * 100).toFixed(1) + "%";

        if (container) {
          var result = SimDraw.drawEquityPaths(container, wr, rr, riskPct, 60, 100);

          if (ruinEl) {
            ruinEl.textContent = result.ruinProbability + "%";
            ruinEl.className   = "stat-value " +
              (result.ruinProbability > 30 ? "crimson" : result.ruinProbability > 10 ? "amber" : "emerald");
          }
          if (kellyEl) {
            kellyEl.textContent = result.kellyFraction + "%";
          }
          if (recEl) {
            var rec = (result.kellyFraction * 0.25).toFixed(1);
            recEl.textContent = rec + " – " + (result.kellyFraction * 0.5).toFixed(1) + "%";
          }
        }

        // Enhance via backend if online
        if (global.ApiClient && global.ApiClient.online) {
          global.ApiClient.monteCarloRuin({
            win_rate: wr, payoff_ratio: rr, risk_per_trade: riskPct,
            n_paths: 500, n_trades: 100
          }, function (err, data) {
            if (!err && data && ruinEl) {
              if (data.ruin_probability !== undefined) {
                ruinEl.textContent = (data.ruin_probability * 100).toFixed(1) + "%";
                ruinEl.className   = "stat-value " +
                  (data.ruin_probability > 0.3 ? "crimson" : data.ruin_probability > 0.1 ? "amber" : "emerald");
              }
            }
          });
        }
      }

      sliderWR.addEventListener("input", update);
      sliderRisk.addEventListener("input", update);
      update();
    },

    /* -- Slide 9: Bias Diagnostic ----------------------------------- */
    initSlide9: function () {
      var slide = document.getElementById("slide-9");
      if (!slide) return;

      var container   = document.getElementById("radar-chart-container");
      var archetypeEl = document.getElementById("stat-diag-archetype");
      var vulnEl      = document.getElementById("stat-diag-vulnerability");
      var descEl      = document.getElementById("stat-diag-desc");

      // Collect current answers
      function getAnswers() {
        var ans = {};
        ["q1","q2","q3","q4","q5","q6"].forEach(function (q) {
          var sel = slide.querySelector('.quiz-likert-scale[data-question="' + q + '"] .likert-btn.selected');
          ans[q] = sel ? parseInt(sel.dataset.val, 10) : 3;
        });
        return ans;
      }

      function updateDiagnostic() {
        var answers = getAnswers();
        var result  = SimMath.scoreBias(answers);

        if (container) SimDraw.drawRadarChart(container, result.scores);
        if (archetypeEl) archetypeEl.textContent = result.archetype;
        if (vulnEl)      vulnEl.textContent = result.vulnerabilityScore + " / 100";
        if (descEl)      descEl.textContent = result.archetypeDesc;

        // Colour vulnerability score
        if (vulnEl) {
          vulnEl.className = "stat-value " +
            (result.vulnerabilityScore > 70 ? "crimson" : result.vulnerabilityScore > 50 ? "amber" : "emerald");
        }

        // Backend enhancement
        if (global.ApiClient && global.ApiClient.online) {
          global.ApiClient.diagnoseBias({ responses: answers }, function (err, data) {
            if (!err && data) {
              if (data.radar_scores && container) {
                SimDraw.drawRadarChart(container, data.radar_scores);
              }
              if (data.vulnerability_score !== undefined && vulnEl) {
                vulnEl.textContent = data.vulnerability_score.toFixed(1) + " / 100";
              }
              if (data.archetype && archetypeEl) {
                archetypeEl.textContent = data.archetype;
              }
            }
          });
        }
      }

      // Wire Likert buttons
      var scales = slide.querySelectorAll(".quiz-likert-scale");
      scales.forEach(function (scale) {
        var btns = scale.querySelectorAll(".likert-btn");
        btns.forEach(function (btn) {
          btn.addEventListener("click", function () {
            btns.forEach(function (b) { b.classList.remove("selected"); });
            btn.classList.add("selected");
            updateDiagnostic();
          });
        });
      });

      updateDiagnostic();
    },

    /* -- Slide 10: Master Trader Blueprint -------------------------- */
    initSlide10: function () {
      var slide = document.getElementById("slide-10");
      if (!slide) return;

      var exportBtn  = document.getElementById("btn-export-protocol");
      var restartBtn = document.getElementById("btn-restart-deck");

      // Checklist live status
      var checkboxes = slide.querySelectorAll(".checklist-checkbox");
      var statusEl   = document.getElementById("s10-checklist-status");

      function updateChecklistStatus() {
        if (!statusEl) return;
        var total   = checkboxes.length;
        var checked = Array.from(checkboxes).filter(function (c) { return c.checked; }).length;
        statusEl.textContent = checked + " / " + total + " conditions met";
        statusEl.style.color = checked === total ? C.emerald : checked >= total * 0.6 ? C.amber : C.crimson;
      }

      checkboxes.forEach(function (cb) {
        cb.addEventListener("change", updateChecklistStatus);
      });
      updateChecklistStatus();

      // Export JSON protocol
      if (exportBtn) {
        exportBtn.addEventListener("click", function () {
          // Gather checklist
          var checklist = [];
          slide.querySelectorAll(".checklist-item").forEach(function (item) {
            var cb    = item.querySelector(".checklist-checkbox");
            var label = item.querySelector(".checklist-text");
            checklist.push({ item: label ? label.textContent.trim() : "", checked: cb ? cb.checked : false });
          });

          // Gather bias responses if available (Slide 9)
          var biasAnswers = {};
          ["q1","q2","q3","q4","q5","q6"].forEach(function (q) {
            var sel = document.querySelector('.quiz-likert-scale[data-question="' + q + '"] .likert-btn.selected');
            biasAnswers[q] = sel ? parseInt(sel.dataset.val, 10) : 3;
          });
          var biasResult = SimMath.scoreBias(biasAnswers);

          var protocol = {
            generated:  new Date().toISOString(),
            tool:       "The Trading Mind // Neuro-Finance Lab",
            version:    "5.0",
            preFlightChecklist: checklist,
            psychProfile: {
              archetype:         biasResult.archetype,
              vulnerabilityScore: biasResult.vulnerabilityScore,
              dominantBias:      biasResult.dominantBias,
              scores:            biasResult.scores
            },
            coreCreed: [
              "I accept that any individual trade outcome is completely random.",
              "I do not need to know what will happen next to make money.",
              "There is a random distribution between wins and losses for any set of variables that define an edge.",
              "An edge is nothing more than an indication of a higher probability of one thing happening over another.",
              "Every moment in the market is uniquely independent."
            ]
          };

          var json = JSON.stringify(protocol, null, 2);
          var blob = new Blob([json], { type: "application/json" });
          var url  = URL.createObjectURL(blob);
          var a    = document.createElement("a");
          a.href     = url;
          a.download = "trading_mind_protocol.json";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          exportBtn.textContent = "✓ Protocol Exported!";
          setTimeout(function () {
            exportBtn.textContent = "Export Psychology Protocol (.JSON)";
          }, 3000);
        });
      }

      // Restart deck
      if (restartBtn) {
        restartBtn.addEventListener("click", function () {
          if (global.DeckEngine && global.__TradingMindApp && global.__TradingMindApp.deck) {
            global.__TradingMindApp.deck.goTo(0);
          }
        });
      }
    },

    /* -- Router: initialise on first visit, re-draw on revisit ------ */
    _redrawOnRevisit: [4, 7, 8, 9],  // 1-based slide numbers that have canvases

    onSlideChange: function (slideNumber) {
      var key = "s" + slideNumber;
      var initFn = this["initSlide" + slideNumber];

      if (!this._initialized[key]) {
        this._initialized[key] = true;
        if (typeof initFn === "function") {
          initFn.call(this);
        }
      } else if (this._redrawOnRevisit.indexOf(slideNumber) !== -1) {
        // Redraw charts on revisit in case container resized
        if (slideNumber === 4) {
          var c4 = document.getElementById("prospect-chart-container");
          if (c4) SimDraw.drawProspectCurve(c4);
        }
        if (slideNumber === 7) {
          var slWR = document.getElementById("slider-expectancy-winrate");
          var slRR = document.getElementById("slider-expectancy-rr");
          var c7   = document.getElementById("expectancy-chart-container");
          if (c7 && slWR && slRR) {
            SimDraw.drawTradeScatter(c7,
              parseInt(slWR.value,10)/100, parseFloat(slRR.value), 200);
          }
        }
        if (slideNumber === 8) {
          var slWR8   = document.getElementById("s8-slider-wr");
          var slRisk8 = document.getElementById("s8-slider-risk");
          var c8      = document.getElementById("ruin-chart-container");
          if (c8 && slWR8 && slRisk8) {
            SimDraw.drawEquityPaths(c8,
              parseInt(slWR8.value,10)/100, 2.0,
              parseFloat(slRisk8.value)/100, 60, 100);
          }
        }
        if (slideNumber === 9) {
          var c9 = document.getElementById("radar-chart-container");
          if (c9) {
            var ans = {};
            ["q1","q2","q3","q4","q5","q6"].forEach(function(q){
              var sel = document.querySelector('.quiz-likert-scale[data-question="'+q+'"] .likert-btn.selected');
              ans[q] = sel ? parseInt(sel.dataset.val,10) : 3;
            });
            SimDraw.drawRadarChart(c9, SimMath.scoreBias(ans).scores);
          }
        }
      }
    },

    /** Call once at startup to wire the deck event and init slide 1 */
    bootstrap: function () {
      var self = this;
      document.addEventListener("deck:slidechange", function (e) {
        self.onSlideChange(e.detail.slideNumber);
      });
      // Initialise slide 1 immediately (it's the landing slide)
      self.onSlideChange(1);
    }

  }; // end Slides

  /* ================================================================== */
  /*  Expose namespace                                                   */
  /* ================================================================== */
  global.TradingSimulators = {
    Math:  SimMath,
    Draw:  SimDraw,
    Slides: Slides
  };

}(window));
