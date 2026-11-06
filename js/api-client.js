/**
 * The Trading Mind — API Client
 * Thin XHR wrapper for the FastAPI backend at http://127.0.0.1:8000
 * Falls back gracefully when the backend is offline.
 * Compatible with direct file:// loading — no fetch(), no Promises required.
 */

(function (global) {
  "use strict";

  var BASE_URL   = "http://127.0.0.1:8000";
  var TIMEOUT_MS = 3000;

  /* ------------------------------------------------------------------ */
  /*  Internal XHR helpers                                               */
  /* ------------------------------------------------------------------ */

  function _get(path, cb) {
    var xhr   = new XMLHttpRequest();
    var done  = false;
    var timer = setTimeout(function () {
      if (!done) { done = true; xhr.abort(); cb(new Error("timeout"), null); }
    }, TIMEOUT_MS);

    xhr.onload = function () {
      clearTimeout(timer);
      if (done) return;
      done = true;
      if (xhr.status >= 200 && xhr.status < 300) {
        try { cb(null, JSON.parse(xhr.responseText)); }
        catch (e) { cb(new Error("JSON parse error"), null); }
      } else {
        cb(new Error("HTTP " + xhr.status), null);
      }
    };

    xhr.onerror = function () {
      clearTimeout(timer);
      if (!done) { done = true; cb(new Error("network error"), null); }
    };

    try {
      xhr.open("GET", BASE_URL + path, true);
      xhr.send();
    } catch (e) {
      clearTimeout(timer);
      cb(e, null);
    }
  }

  function _post(path, payload, cb) {
    var xhr   = new XMLHttpRequest();
    var done  = false;
    var timer = setTimeout(function () {
      if (!done) { done = true; xhr.abort(); cb(new Error("timeout"), null); }
    }, TIMEOUT_MS);

    xhr.onload = function () {
      clearTimeout(timer);
      if (done) return;
      done = true;
      if (xhr.status >= 200 && xhr.status < 300) {
        try { cb(null, JSON.parse(xhr.responseText)); }
        catch (e) { cb(new Error("JSON parse error"), null); }
      } else {
        cb(new Error("HTTP " + xhr.status), null);
      }
    };

    xhr.onerror = function () {
      clearTimeout(timer);
      if (!done) { done = true; cb(new Error("network error"), null); }
    };

    try {
      xhr.open("POST", BASE_URL + path, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(JSON.stringify(payload));
    } catch (e) {
      clearTimeout(timer);
      cb(e, null);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Public ApiClient object                                            */
  /* ------------------------------------------------------------------ */

  var ApiClient = {
    /** true when the last health-check succeeded */
    online: false,

    /**
     * Ping /api/health and invoke cb(isOnline: boolean).
     * Also updates the header status pill if present.
     */
    checkHealth: function (cb) {
      var self = this;
      _get("/api/health", function (err, data) {
        self.online = !err && !!data;
        if (cb) cb(self.online);
      });
    },

    /**
     * Prospect Theory value-function curve.
     * payload: { gains: number[], losses: number[], alpha?: number, beta?: number, lambda?: number }
     * cb(err, { gains_values, losses_values, ... })
     */
    prospectTheory: function (payload, cb) {
      _post("/api/simulate/prospect-theory", payload, cb);
    },

    /**
     * Monte Carlo ruin simulation.
     * payload: { win_rate, payoff_ratio, risk_per_trade, n_paths?, n_trades? }
     * cb(err, { ruin_probability, median_equity, ... })
     */
    monteCarloRuin: function (payload, cb) {
      _post("/api/simulate/monte-carlo-ruin", payload, cb);
    },

    /**
     * Tilt / cognitive-decay curve.
     * payload: { consecutive_losses, leverage? }
     * cb(err, { decision_quality, risk_multiplier, ... })
     */
    tiltDecay: function (payload, cb) {
      _post("/api/simulate/tilt-decay", payload, cb);
    },

    /**
     * Bias diagnostic scoring.
     * payload: { responses: { q1..q6: number (1-5) } }
     * cb(err, { radar_scores, archetype, vulnerability_score, ... })
     */
    diagnoseBias: function (payload, cb) {
      _post("/api/analytics/diagnose-bias", payload, cb);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Expose globally                                                     */
  /* ------------------------------------------------------------------ */
  global.ApiClient = ApiClient;

}(window));
