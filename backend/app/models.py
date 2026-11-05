"""Data models and schemas for The Trading Mind Analytics API."""

from __future__ import annotations
from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """API health status schema."""
    status: str = Field(default="ok", description="Server operational status")
    version: str = Field(default="1.0.0", description="Backend API version")
    service: str = Field(default="The Trading Mind Analytics Engine")
    timestamp: str = Field(description="ISO-8601 server timestamp")


# ---------------------------------------------------------
# Prospect Theory Schemas
# ---------------------------------------------------------
class ProspectTheoryRequest(BaseModel):
    """Parameters for Kahneman-Tversky Prospect Theory Value Curve."""
    alpha: float = Field(default=0.88, ge=0.1, le=1.0, description="Diminishing sensitivity for gains")
    beta: float = Field(default=0.88, ge=0.1, le=1.0, description="Diminishing sensitivity for losses")
    lambda_param: float = Field(default=2.25, ge=1.0, le=5.0, description="Loss aversion multiplier (typically ~2.25)")
    gamma: float = Field(default=0.61, ge=0.1, le=1.0, description="Probability weighting parameter for gains")
    delta: float = Field(default=0.69, ge=0.1, le=1.0, description="Probability weighting parameter for losses")
    range_min: float = Field(default=-1000.0, description="Minimum outcome dollar value")
    range_max: float = Field(default=1000.0, description="Maximum outcome dollar value")
    num_points: int = Field(default=100, ge=20, le=500, description="Number of curve resolution points")


class ProspectPoint(BaseModel):
    x: float = Field(description="Outcome amount (dollar gain or loss)")
    v: float = Field(description="Subjective psychological value / utility")


class ProspectTheoryResponse(BaseModel):
    alpha: float
    beta: float
    lambda_param: float
    asymmetry_ratio: float
    loss_multiplier: float
    curve: List[ProspectPoint]
    key_insights: List[str]


# ---------------------------------------------------------
# Monte Carlo & Ruin Simulation Schemas
# ---------------------------------------------------------
class MonteCarloRuinRequest(BaseModel):
    """Configuration for Monte Carlo risk-of-ruin equity path simulation."""
    initial_capital: float = Field(default=10000.0, gt=0, description="Starting trading account balance")
    win_rate: float = Field(default=0.50, ge=0.01, le=0.99, description="Probability of a winning trade (0.0 to 1.0)")
    risk_reward_ratio: float = Field(default=1.5, gt=0.1, le=20.0, description="Average profit on win / Average loss on loss")
    risk_per_trade_pct: float = Field(default=2.0, gt=0.1, le=50.0, description="Percentage of current equity risked per trade")
    num_trades: int = Field(default=100, ge=10, le=500, description="Number of sequential trades per path")
    num_simulations: int = Field(default=1000, ge=50, le=5000, description="Number of Monte Carlo iterations")
    ruin_threshold_pct: float = Field(default=50.0, ge=5.0, le=99.0, description="Drawdown percentage that triggers ruin / catastrophic failure")
    sizing_model: Literal["fixed_fractional", "fixed_dollar", "kelly", "half_kelly", "martingale"] = Field(
        default="fixed_fractional",
        description="Position sizing methodology"
    )


class MonteCarloRuinResponse(BaseModel):
    ruin_probability: float = Field(description="Percentage of paths hitting ruin threshold (0.0 to 100.0)")
    max_drawdown_avg: float = Field(description="Average maximum drawdown across all paths (%)")
    max_drawdown_worst: float = Field(description="Worst maximum drawdown observed across all paths (%)")
    median_final_equity: float = Field(description="Median account balance at trade end")
    percentile_5: float = Field(description="5th percentile outcome (near worst-case)")
    percentile_95: float = Field(description="95th percentile outcome (near best-case)")
    kelly_criterion: float = Field(description="Theoretical optimal full Kelly fraction (%)")
    recommended_risk_pct: float = Field(description="Recommended risk per trade based on Kelly and volatility")
    expectancy: float = Field(description="Mathematical expectancy per trade in R units")
    sample_paths: List[List[float]] = Field(description="Sample equity curve trajectories for visualization")
    summary_verdict: str = Field(description="Educational risk assessment verdict")


# ---------------------------------------------------------
# Tilt Decay & Emotional Cycle Schemas
# ---------------------------------------------------------
class TiltDecayRequest(BaseModel):
    """Inputs to model emotional fatigue and tilt escalation."""
    consecutive_losses: int = Field(default=3, ge=0, le=20, description="Current run of losing trades")
    baseline_discipline_score: float = Field(default=85.0, ge=10.0, le=100.0, description="Base mental discipline rating (0-100)")
    sleep_fatigue_level: float = Field(default=0.2, ge=0.0, le=1.0, description="Fatigue index (0=well-rested, 1=exhausted)")
    trade_frequency_multiplier: float = Field(default=1.0, ge=0.5, le=5.0, description="Overtrading pace multiplier")


class TiltDecayPoint(BaseModel):
    loss_count: int
    discipline_score: float
    decision_quality_pct: float
    impulsive_risk_multiplier: float
    state_label: str


class TiltDecayResponse(BaseModel):
    current_state: str = Field(description="Current emotional tier (CALM, ALERT, FRUSTRATED, TILT_EARLY, FULL_TILT)")
    current_discipline: float = Field(description="Current calculated discipline score")
    current_decision_quality: float = Field(description="Current decision quality percentage")
    risk_escalation_factor: float = Field(description="Propensity multiplier to oversize trades or break rules")
    decay_curve: List[TiltDecayPoint] = Field(description="Simulated progression of tilt over 0 to 10 losses")
    recommendations: List[str] = Field(description="Actionable behavioral intervention recommendations")


# ---------------------------------------------------------
# Trader Bias Diagnostic Schemas
# ---------------------------------------------------------
class BiasDiagnosisRequest(BaseModel):
    """Diagnostic self-assessment responses."""
    # 6 survey questions (1 to 5 scale)
    q1_holding_losers: int = Field(default=3, ge=1, le=5, description="Q1: I hold onto losing trades hoping they will break even")
    q2_cutting_winners: int = Field(default=3, ge=1, le=5, description="Q2: I close profitable trades early out of fear profit will vanish")
    q3_revenge_trading: int = Field(default=2, ge=1, le=5, description="Q3: After a painful loss, I immediately enter another trade to recover")
    q4_overconfidence: int = Field(default=3, ge=1, le=5, description="Q4: After 3+ consecutive wins, I increase position size significantly")
    q5_pattern_delusion: int = Field(default=2, ge=1, le=5, description="Q5: I believe a reversal is 'due' because market has gone in one direction too long")
    q6_regret_hesitation: int = Field(default=3, ge=1, le=5, description="Q6: Missing a trade makes me FOMO enter late or freeze on next valid setup")
    
    experience_months: int = Field(default=12, ge=0, le=600, description="Trader experience in months")
    typical_holding_loss_pct: float = Field(default=12.0, ge=0.0, description="Average loss % before exiting bad trade")
    typical_cutting_profit_pct: float = Field(default=4.0, ge=0.0, description="Average profit % before exiting winning trade")


class BiasDimension(BaseModel):
    key: str
    name: str
    score: float = Field(description="Bias severity score from 0 (low bias) to 100 (severe bias)")
    status: str = Field(description="Severity classification: Low, Moderate, Elevated, Severe")
    description: str


class BiasDiagnosisResponse(BaseModel):
    overall_vulnerability_score: float = Field(description="Aggregate psychological vulnerability index (0-100)")
    archetype: str = Field(description="Primary trader behavioral archetype")
    disposition_effect_ratio: float = Field(description="Holding Loss % / Cutting Profit % (Ratio > 1 indicates disposition bias)")
    dimensions: List[BiasDimension]
    strengths: List[str]
    critical_traps: List[str]
    action_protocol: List[str]
