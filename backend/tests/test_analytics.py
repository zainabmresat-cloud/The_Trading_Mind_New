"""Comprehensive test suite for The Trading Mind Analytics backend."""

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.models import (
    ProspectTheoryRequest,
    MonteCarloRuinRequest,
    TiltDecayRequest,
    BiasDiagnosisRequest,
)
from backend.app.analytics import (
    compute_prospect_theory,
    compute_monte_carlo_ruin,
    compute_tilt_decay,
    compute_bias_diagnosis,
)

client = TestClient(app)


# =====================================================================
# Unit Tests for Analytics Math Functions
# =====================================================================
class TestProspectTheory:
    def test_prospect_theory_basic(self):
        req = ProspectTheoryRequest(
            alpha=0.88,
            beta=0.88,
            lambda_param=2.25,
            range_min=-500.0,
            range_max=500.0,
            num_points=50,
        )
        res = compute_prospect_theory(req)
        assert len(res.curve) == 50
        assert res.asymmetry_ratio > 1.5
        assert res.loss_multiplier == 2.25
        assert len(res.key_insights) >= 3

        # Test zero point
        zero_pt = next((pt for pt in res.curve if abs(pt.x) < 1e-4), None)
        if zero_pt:
            assert abs(zero_pt.v) < 1e-3

        # Value at +100 vs -100
        pos_pt = next(pt for pt in res.curve if pt.x > 0)
        neg_pt = next(pt for pt in res.curve if pt.x < 0)
        assert pos_pt.v > 0
        assert neg_pt.v < 0


class TestMonteCarloRuin:
    def test_monte_carlo_resilient_strategy(self):
        # 60% win rate, 1.5 R:R, 1% risk per trade -> strong positive expectancy
        req = MonteCarloRuinRequest(
            initial_capital=10000.0,
            win_rate=0.60,
            risk_reward_ratio=1.5,
            risk_per_trade_pct=1.0,
            num_trades=50,
            num_simulations=200,
            ruin_threshold_pct=50.0,
            sizing_model="fixed_fractional",
        )
        res = compute_monte_carlo_ruin(req)
        assert res.expectancy > 0
        assert res.kelly_criterion > 0
        assert res.ruin_probability <= 5.0
        assert res.median_final_equity > 10000.0
        assert len(res.sample_paths) > 0
        assert len(res.sample_paths[0]) > 0

    def test_monte_carlo_reckless_risk(self):
        # 40% win rate, 1:1 R:R, 25% risk per trade -> disastrous negative expectancy & huge risk
        req = MonteCarloRuinRequest(
            initial_capital=10000.0,
            win_rate=0.40,
            risk_reward_ratio=1.0,
            risk_per_trade_pct=25.0,
            num_trades=60,
            num_simulations=200,
            ruin_threshold_pct=50.0,
            sizing_model="fixed_fractional",
        )
        res = compute_monte_carlo_ruin(req)
        assert res.expectancy < 0
        assert res.ruin_probability > 50.0

    @pytest.mark.parametrize("model", ["fixed_fractional", "fixed_dollar", "kelly", "half_kelly", "martingale"])
    def test_sizing_models(self, model):
        req = MonteCarloRuinRequest(
            initial_capital=5000.0,
            win_rate=0.55,
            risk_reward_ratio=1.2,
            risk_per_trade_pct=2.0,
            num_trades=30,
            num_simulations=100,
            sizing_model=model,
        )
        res = compute_monte_carlo_ruin(req)
        assert isinstance(res.ruin_probability, float)
        assert isinstance(res.median_final_equity, float)


class TestTiltDecay:
    def test_tilt_decay_progression(self):
        req = TiltDecayRequest(
            consecutive_losses=4,
            baseline_discipline_score=85.0,
            sleep_fatigue_level=0.3,
            trade_frequency_multiplier=1.2,
        )
        res = compute_tilt_decay(req)
        assert len(res.decay_curve) == 11
        
        # Loss 0 should have higher quality than Loss 10
        assert res.decay_curve[0].decision_quality_pct > res.decay_curve[10].decision_quality_pct
        # Risk multiplier should increase with losses
        assert res.decay_curve[10].impulsive_risk_multiplier > res.decay_curve[0].impulsive_risk_multiplier
        assert len(res.recommendations) > 0


class TestBiasDiagnosis:
    def test_bias_diagnosis_disciplined(self):
        req = BiasDiagnosisRequest(
            q1_holding_losers=1,
            q2_cutting_winners=1,
            q3_revenge_trading=1,
            q4_overconfidence=1,
            q5_pattern_delusion=1,
            q6_regret_hesitation=1,
            typical_holding_loss_pct=2.0,
            typical_cutting_profit_pct=6.0,
        )
        res = compute_bias_diagnosis(req)
        assert res.overall_vulnerability_score < 30.0
        assert res.disposition_effect_ratio < 1.0
        assert len(res.dimensions) == 6
        assert len(res.action_protocol) >= 4

    def test_bias_diagnosis_vulnerable(self):
        req = BiasDiagnosisRequest(
            q1_holding_losers=5,
            q2_cutting_winners=5,
            q3_revenge_trading=5,
            q4_overconfidence=4,
            q5_pattern_delusion=4,
            q6_regret_hesitation=5,
            typical_holding_loss_pct=25.0,
            typical_cutting_profit_pct=3.0,
        )
        res = compute_bias_diagnosis(req)
        assert res.overall_vulnerability_score > 70.0
        assert res.disposition_effect_ratio > 5.0
        assert len(res.critical_traps) > 0


# =====================================================================
# Integration Tests for FastAPI Endpoints
# =====================================================================
class TestApiEndpoints:
    def test_root_endpoint(self):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "online"

    def test_health_endpoint(self):
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "timestamp" in data

    def test_simulate_prospect_theory_endpoint(self):
        payload = {
            "alpha": 0.88,
            "beta": 0.88,
            "lambda_param": 2.25,
            "range_min": -200,
            "range_max": 200,
            "num_points": 25,
        }
        response = client.post("/api/simulate/prospect-theory", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "curve" in data
        assert len(data["curve"]) == 25

    def test_simulate_monte_carlo_endpoint(self):
        payload = {
            "initial_capital": 10000,
            "win_rate": 0.52,
            "risk_reward_ratio": 1.5,
            "risk_per_trade_pct": 2.0,
            "num_trades": 50,
            "num_simulations": 100,
            "ruin_threshold_pct": 50.0,
            "sizing_model": "fixed_fractional",
        }
        response = client.post("/api/simulate/monte-carlo-ruin", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "ruin_probability" in data
        assert "median_final_equity" in data
        assert "sample_paths" in data

    def test_simulate_tilt_decay_endpoint(self):
        payload = {
            "consecutive_losses": 3,
            "baseline_discipline_score": 80.0,
            "sleep_fatigue_level": 0.25,
            "trade_frequency_multiplier": 1.0,
        }
        response = client.post("/api/simulate/tilt-decay", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "current_state" in data
        assert "decay_curve" in data

    def test_diagnose_bias_endpoint(self):
        payload = {
            "q1_holding_losers": 4,
            "q2_cutting_winners": 4,
            "q3_revenge_trading": 3,
            "q4_overconfidence": 2,
            "q5_pattern_delusion": 3,
            "q6_regret_hesitation": 4,
            "experience_months": 24,
            "typical_holding_loss_pct": 10.0,
            "typical_cutting_profit_pct": 5.0,
        }
        response = client.post("/api/analytics/diagnose-bias", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "overall_vulnerability_score" in data
        assert "archetype" in data
        assert "dimensions" in data
