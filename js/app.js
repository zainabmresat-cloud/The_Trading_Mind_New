/**
 * The Trading Mind - Main Application Bootstrapper
 * Classic (non-module) script — compatible with direct file:// loading.
 * DeckEngine is loaded before this file and exposed on window.DeckEngine.
 */

(function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /*  Web Audio API Sound Synthesizer — zero external dependencies       */
  /* ------------------------------------------------------------------ */
  function AudioEffects() {
    this.ctx = null;
    this.muted = false;
  }

  AudioEffects.prototype.initContext = function () {
    if (!this.ctx) {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) this.ctx = new Ctx();
    }
  };

  AudioEffects.prototype._play = function (type, freqStart, freqEnd, duration, gain) {
    if (this.muted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      if (this.ctx.state === "suspended") this.ctx.resume();

      var osc  = this.ctx.createOscillator();
      var gainNode = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freqEnd, this.ctx.currentTime + duration);

      gainNode.gain.setValueAtTime(gain, this.ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (_) {}
  };

  AudioEffects.prototype.playClick = function () {
    this._play("sine", 800, 400, 0.04, 0.04);
  };

  AudioEffects.prototype.playTransition = function () {
    this._play("triangle", 300, 600, 0.08, 0.03);
  };

  /* ------------------------------------------------------------------ */
  /*  App                                                                 */
  /* ------------------------------------------------------------------ */
  function App() {
    this.audio = new AudioEffects();
    this.deck  = null;
    this.backendOnline = false;
  }

  App.prototype.start = function () {
    console.log(
      "%c The Trading Mind // Neuro-Finance Presentation System Initialized",
      "color: #00f0ff; font-weight: bold;"
    );

    // DeckEngine is defined in deck.js, loaded via a plain <script> before this file
    if (typeof window.DeckEngine === "undefined") {
      console.error("[App] DeckEngine not found — make sure deck.js is loaded first.");
      return;
    }

    this.deck = new window.DeckEngine();

    var self = this;

    // Hook audio to slide transitions
    document.addEventListener("deck:slidechange", function (e) {
      self.audio.playTransition();
      self.onSlideChange(e.detail);
    });

    // Mute toggle
    var btnSound = document.getElementById("btn-toggle-sound");
    if (btnSound) {
      btnSound.addEventListener("click", function () {
        self.audio.muted = !self.audio.muted;
        btnSound.textContent = self.audio.muted ? "🔇" : "🔊";
        btnSound.title = self.audio.muted ? "Unmute Sound" : "Mute Sound";
      });
    }

    // Attach click audio to interactive elements
    document.addEventListener("click", function (e) {
      var t = e.target;
      if (t.closest && (t.closest("button") || t.closest(".btn") ||
          t.closest(".overview-card") || t.closest(".pill-option"))) {
        self.audio.playClick();
      }
    });

    // Bootstrap simulation engine (simulators.js must be loaded before app.js)
    if (typeof window.TradingSimulators !== "undefined") {
      window.TradingSimulators.Slides.bootstrap();
      console.log("[App] TradingSimulators engine bootstrapped.");
    } else {
      console.warn("[App] TradingSimulators not found — simulators.js may not be loaded.");
    }

    // Backend status check (uses ApiClient from api-client.js when available)
    self.checkBackendStatus();
    setInterval(function () { self.checkBackendStatus(); }, 15000);
  };

  App.prototype.checkBackendStatus = function () {
    var statusPill = document.getElementById("backend-status-pill");
    var statusText = document.getElementById("backend-status-text");
    if (!statusPill || !statusText) return;

    var self = this;

    // Prefer ApiClient (api-client.js) for the health check if available.
    // Fall back to raw XHR for resilience.
    if (typeof window.ApiClient !== "undefined") {
      window.ApiClient.checkHealth(function (isOnline) {
        self.backendOnline = isOnline;
        if (isOnline) {
          statusPill.className = "status-pill online";
          statusText.textContent = "ENGINE: FASTAPI ONLINE";
        } else {
          self._setBackendOffline(statusPill, statusText);
        }
      });
      return;
    }

    // Raw XHR fallback
    var xhr = new XMLHttpRequest();
    var timedOut = false;
    var timer = setTimeout(function () {
      timedOut = true;
      xhr.abort();
      self._setBackendOffline(statusPill, statusText);
    }, 2500);

    xhr.onload = function () {
      clearTimeout(timer);
      if (!timedOut && xhr.status === 200) {
        self.backendOnline = true;
        statusPill.className = "status-pill online";
        statusText.textContent = "ENGINE: FASTAPI ONLINE";
      } else {
        self._setBackendOffline(statusPill, statusText);
      }
    };

    xhr.onerror = function () {
      clearTimeout(timer);
      self._setBackendOffline(statusPill, statusText);
    };

    try {
      xhr.open("GET", "http://127.0.0.1:8000/api/health", true);
      xhr.send();
    } catch (_) {
      clearTimeout(timer);
      self._setBackendOffline(statusPill, statusText);
    }
  };

  App.prototype._setBackendOffline = function (pill, text) {
    this.backendOnline = false;
    pill.className = "status-pill offline";
    text.textContent = "ENGINE: CLIENT FALLBACK";
  };

  App.prototype.onSlideChange = function (detail) {
    console.log("[Deck] Slide activated: #" + detail.slideNumber + " (" + detail.slideId + ")");
  };

  /* ------------------------------------------------------------------ */
  /*  Bootstrap on DOM ready                                              */
  /* ------------------------------------------------------------------ */
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  ready(function () {
    window.__TradingMindApp = new App();
    window.__TradingMindApp.start();
  });

})();
