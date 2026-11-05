"""Analytical and mathematical simulation algorithms for The Trading Mind."""

from __future__ import annotations
import math
from typing import List, Dict, Any, Tuple
import numpy as np

from .models import (
    ProspectTheoryRequest,
    ProspectTheoryResponse,
    ProspectPoint,
    MonteCarloRuinRequest,
    MonteCarloRuinResponse,
    TiltDecayRequest,
    TiltDecayResponse,
    TiltDecayPoint,
    BiasDiagnosisRequest,
    BiasDiagnosisResponse,
    BiasDimension,
)


def compute_prospect_theory(params: ProspectTheoryRequest) -> ProspectTheoryResponse:
    """Computes Kahneman-Tversky (1979/1992) Cumulative Prospect Theory value function.
    
    Formula:
      v(x) =  x^alpha           for x >= 0
      v(x) = -lambda * (-x)^beta for x < 0
    """
    alpha = float(params.alpha)
    beta = float(params.beta)
    lam = float(params.lambda_param)
    
    x_vals = np.linspace(params.range_min, params.range_max, params.num_points)
    curve_points: List[ProspectPoint] = []
    
    for x in x_vals:
        x_float = float(x)
        if x_float >= 0:
            v = math.pow(x_float, alpha) if x_float > 0 else 0.0
        else:
            v = -lam * math.pow(abs(x_float), beta)
        curve_points.append(ProspectPoint(x=round(x_float, 2), v=round(v, 3)))
    
    # Calculate asymmetry ratio at reference value of 100
    v_pos100 = math.pow(100.0, alpha)
    v_neg100 = abs(-lam * math.pow(100.0, beta))
    asymmetry_ratio = round(v_neg100 / max(0.001, v_pos100), 2)
    
    insights = [
        f"Loss Aversion Factor: A loss of $100 feels psychologically {asymmetry_ratio}x more painful than an equivalent $100 gain feels rewarding.",
        f"Diminishing Sensitivity: Alpha={alpha:.2f} and Beta={beta:.2f} explain why traders become risk-averse when in profit (locking in gains prematurely) but become risk-seeking gamblers when underwater (refusing to cut losers).",
        "Disposition Effect Link: Traders systematically hold losing trades too long because the pain curve flattens out in deep drawdown, while taking profits too quickly because the reward curve flattens out in green territory."
    ]
    
    return ProspectTheoryResponse(
        alpha=alpha,
        beta=beta,
        lambda_param=lam,
        asymmetry_ratio=asymmetry_ratio,
        loss_multiplier=round(lam, 2),
        curve=curve_points,
        key_insights=insights,
    )


def compute_monte_carlo_ruin(params: MonteCarloRuinRequest) -> MonteCarloRuinResponse:
    """Executes a vectorized Monte Carlo simulation to evaluate equity curves and probability of ruin.
    
    Calculates Kelly criterion, expected value per trade, maximum drawdown distributions,
    and downsamples sample paths for fast JSON delivery.
    """
    p = float(params.win_rate)
    q = 1.0 - p
    b = float(params.risk_reward_ratio)
    init_cap = float(params.initial_capital)
    risk_pct = float(params.risk_per_trade_pct) / 100.0
    num_trades = int(params.num_trades)
    num_sims = int(params.num_simulations)
    ruin_dd_frac = float(params.ruin_threshold_pct) / 100.0
    
    # 1. Theoretical Kelly Criterion: f* = (p * (b + 1) - 1) / b
    kelly_fraction = (p * (b + 1.0) - 1.0) / b
    kelly_pct = round(max(-100.0, min(100.0, kelly_fraction * 100.0)), 2)
    
    # 2. Mathematical Expectancy in R: EV = (p * b) - (q * 1.0)
    expectancy_r = round((p * b) - q, 3)
    
    # Recommended risk per trade (typically half-kelly or capped safe fraction)
    if kelly_fraction > 0:
        recommended_risk = round(min(5.0, max(0.5, (kelly_fraction * 100.0) / 2.0)), 2)
    else:
        recommended_risk = 0.0
    
    # 3. Vectorized simulation of trade outcomes (1 for win, 0 for loss)
    rng = np.random.default_rng(seed=1337)
    outcomes = rng.binomial(n=1, p=p, size=(num_sims, num_trades))
    
    # Pre-allocate equity paths matrix
    equity_paths = np.zeros((num_sims, num_trades + 1), dtype=np.float64)
    equity_paths[:, 0] = init_cap
    
    ruined_sims = np.zeros(num_sims, dtype=bool)
    max_drawdowns = np.zeros(num_sims, dtype=np.float64)
    
    # Simulation step loop
    current_equities = np.full(num_sims, init_cap, dtype=np.float64)
    peak_equities = np.full(num_sims, init_cap, dtype=np.float64)
    
    martingale_streaks = np.zeros(num_sims, dtype=np.int32)
    
    for t in range(num_trades):
        # Determine position sizing per path
        if params.sizing_model == "fixed_dollar":
            risk_dollars = init_cap * risk_pct
        elif params.sizing_model == "kelly":
            eff_k = max(0.005, min(0.35, kelly_fraction)) if kelly_fraction > 0 else 0.005
            risk_dollars = current_equities * eff_k
        elif params.sizing_model == "half_kelly":
            eff_hk = max(0.005, min(0.20, kelly_fraction / 2.0)) if kelly_fraction > 0 else 0.005
            risk_dollars = current_equities * eff_hk
        elif params.sizing_model == "martingale":
            multiplier = np.clip(np.power(2.0, martingale_streaks.astype(np.float64)), 1.0, 64.0)
            risk_dollars = (init_cap * risk_pct) * multiplier
        else: # fixed_fractional
            risk_dollars = current_equities * risk_pct
            
        # Ensure risk cannot exceed current equity or go below zero
        risk_dollars = np.clip(risk_dollars, 0.0, np.maximum(0.0, current_equities))
        
        # Calculate PnL for step t
        win_mask = outcomes[:, t] == 1
        pnl = np.where(win_mask, risk_dollars * b, -risk_dollars)
        
        # Update Martingale loss streaks
        martingale_streaks = np.where(win_mask, 0, martingale_streaks + 1)
        
        # Update equity
        current_equities += pnl
        current_equities = np.maximum(0.0, current_equities)
        equity_paths[:, t + 1] = current_equities
        
        # Track peaks and drawdowns
        peak_equities = np.maximum(peak_equities, current_equities)
        with np.errstate(divide='ignore', invalid='ignore'):
            cur_dd = np.where(peak_equities > 0, (peak_equities - current_equities) / peak_equities, 0.0)
        max_drawdowns = np.maximum(max_drawdowns, cur_dd)
        
        # Check ruin trigger: drawdown exceeding threshold OR equity near zero
        ruined_sims = ruined_sims | (max_drawdowns >= ruin_dd_frac) | (current_equities <= init_cap * (1.0 - ruin_dd_frac))
    
    # Summary statistics
    ruin_probability = round(float(np.mean(ruined_sims) * 100.0), 2)
    max_drawdown_avg = round(float(np.mean(max_drawdowns) * 100.0), 2)
    max_drawdown_worst = round(float(np.max(max_drawdowns) * 100.0), 2)
    
    final_equities = equity_paths[:, -1]
    median_final_equity = round(float(np.median(final_equities)), 2)
    p5 = round(float(np.percentile(final_equities, 5)), 2)
    p95 = round(float(np.percentile(final_equities, 95)), 2)
    
    # Pick 8 diverse sample paths for display (downsample to at most 50 steps each)
    step_stride = max(1, (num_trades + 1) // 50)
    sample_indices = [
        int(np.argmin(final_equities)), # Worst path
        int(np.argmax(final_equities)), # Best path
        int(np.argsort(final_equities)[num_sims // 4]), # 25th percentile
        int(np.argsort(final_equities)[num_sims // 2]), # Median path
        int(np.argsort(final_equities)[(num_sims * 3) // 4]), # 75th percentile
        1, 7, 13 # Arbitrary sample paths
    ]
    # Deduplicate indices
    sample_indices = sorted(list(set(sample_indices)))
    
    sample_paths: List[List[float]] = []
    for idx in sample_indices:
        raw_path = equity_paths[idx, ::step_stride].tolist()
        # Always ensure the final point is included
        if raw_path[-1] != equity_paths[idx, -1]:
            raw_path.append(float(equity_paths[idx, -1]))
        sample_paths.append([round(v, 2) for v in raw_path])
    
    # Generate educational verdict
    if expectancy_r <= 0:
        verdict = f"NEGATIVE EXPECTANCY (EV = {expectancy_r:.2f}R). No position sizing strategy can prevent eventual mathematical ruin. Psychological tilt will accelerate bankruptcy."
    elif ruin_probability > 30.0:
        verdict = f"DANGEROUS RISK PROFILE ({ruin_probability}% Ruin Probability). Even with a positive statistical edge, risking {params.risk_per_trade_pct}% per trade causes fatal drawdowns."
    elif ruin_probability > 5.0:
        verdict = f"MODERATE RISK ({ruin_probability}% Ruin Probability). Drawdown volatility is substantial (Avg Max DD: {max_drawdown_avg}%). Consider reducing risk per trade toward {recommended_risk}%."
    else:
        verdict = f"MATHEMATICALLY RESILIENT ({ruin_probability}% Ruin Probability). Sizing is well within sustainable Kelly bounds. System survives normal statistical drawdown clusters."

    return MonteCarloRuinResponse(
        ruin_probability=ruin_probability,
        max_drawdown_avg=max_drawdown_avg,
        max_drawdown_worst=max_drawdown_worst,
        median_final_equity=median_final_equity,
        percentile_5=p5,
        percentile_95=p95,
        kelly_criterion=kelly_pct,
        recommended_risk_pct=recommended_risk,
        expectancy=expectancy_r,
        sample_paths=sample_paths,
        summary_verdict=verdict,
    )


def compute_tilt_decay(params: TiltDecayRequest) -> TiltDecayResponse:
    """Models cognitive fatigue and emotional tilt degradation as losing streaks compound.
    
    Uses exponential decay modified by sleep deprivation and overtrading frequency.
    """
    losses = params.consecutive_losses
    base_disc = params.baseline_discipline_score
    fatigue = params.sleep_fatigue_level
    freq_mult = params.trade_frequency_multiplier
    
    decay_curve: List[TiltDecayPoint] = []
    
    # Simulate progression from 0 to 10 losses
    for k in range(11):
        # Stress compounding function
        stress_factor = (k ** 1.35) * 0.12 * (1.0 + 0.9 * fatigue) * freq_mult
        disc = max(5.0, base_disc * math.exp(-stress_factor))
        
        # Decision quality is discipline penalized by emotional reaction
        quality = max(5.0, disc * max(0.1, 1.0 - 0.06 * k))
        
        # Impulsive risk multiplier (tendency to revenge trade or oversize)
        impulsive_mult = 1.0 + math.pow((100.0 - quality) / 100.0, 2.2) * 3.5
        
        if quality >= 80:
            label = "CALM"
        elif quality >= 65:
            label = "ALERT"
        elif quality >= 50:
            label = "FRUSTRATED"
        elif quality >= 35:
            label = "TILT_EARLY"
        else:
            label = "FULL_TILT"
            
        decay_curve.append(TiltDecayPoint(
            loss_count=k,
            discipline_score=round(disc, 1),
            decision_quality_pct=round(quality, 1),
            impulsive_risk_multiplier=round(impulsive_mult, 2),
            state_label=label,
        ))
        
    current_point = decay_curve[min(losses, 10)]
    
    recommendations: List[str] = []
    if current_point.state_label == "FULL_TILT":
        recommendations = [
            "CRITICAL: Immediate mandatory terminal shutdown. Walk away from screens for a minimum of 4 hours.",
            "Physiological Reset: High amygdala activation impairs prefrontal cortex executive reasoning. Physical walking or cold water face immersion accelerates cortisol clearance.",
            "Do NOT attempt to recover losses today. Revenge trading at this stage has an 80%+ empirical failure rate."
        ]
    elif current_point.state_label in ("TILT_EARLY", "FRUSTRATED"):
        recommendations = [
            "Cut trade sizing in half immediately (defensive sizing).",
            "Enforce a mandatory 15-minute cool-down timer between any order submissions.",
            "Review trade plan criteria: are setups satisfying strict A+ rules or are you looking for action?"
        ]
    else:
        recommendations = [
            "Discipline levels are within standard operating thresholds.",
            "Maintain position sizing consistency; do not increase size out of optimism.",
            "Continue logging emotional status after each execution."
        ]

    return TiltDecayResponse(
        current_state=current_point.state_label,
        current_discipline=current_point.discipline_score,
        current_decision_quality=current_point.decision_quality_pct,
        risk_escalation_factor=current_point.impulsive_risk_multiplier,
        decay_curve=decay_curve,
        recommendations=recommendations,
    )


def compute_bias_diagnosis(params: BiasDiagnosisRequest) -> BiasDiagnosisResponse:
    """Evaluates trader responses to calculate multidimensional psychological bias vulnerabilities."""
    
    # 1. Calculate individual bias dimension scores (0 to 100)
    # Scale from survey 1-5 to 0-100: (score - 1) / 4 * 100
    loss_aversion_score = ((params.q1_holding_losers - 1) / 4.0) * 100.0
    premature_exit_score = ((params.q2_cutting_winners - 1) / 4.0) * 100.0
    revenge_score = ((params.q3_revenge_trading - 1) / 4.0) * 100.0
    overconfidence_score = ((params.q4_overconfidence - 1) / 4.0) * 100.0
    gambler_fallacy_score = ((params.q5_pattern_delusion - 1) / 4.0) * 100.0
    fomo_regret_score = ((params.q6_regret_hesitation - 1) / 4.0) * 100.0
    
    # Empirical disposition effect ratio
    disposition_ratio = round(
        params.typical_holding_loss_pct / max(0.1, params.typical_cutting_profit_pct), 2
    )
    
    # Adjust loss aversion dimension by empirical holding behavior
    if disposition_ratio > 2.0:
        loss_aversion_score = min(100.0, loss_aversion_score + 15.0)
    
    def classify(val: float) -> str:
        if val < 30.0:
            return "Low"
        elif val < 55.0:
            return "Moderate"
        elif val < 75.0:
            return "Elevated"
        return "Severe"

    dimensions = [
        BiasDimension(
            key="loss_aversion",
            name="Loss Aversion",
            score=round(loss_aversion_score, 1),
            status=classify(loss_aversion_score),
            description="Pain of losing outweighs joy of winning, driving reluctance to accept stops."
        ),
        BiasDimension(
            key="disposition_effect",
            name="Disposition Effect",
            score=round(premature_exit_score, 1),
            status=classify(premature_exit_score),
            description="Tendency to harvest small green profits quickly while letting red trades bleed."
        ),
        BiasDimension(
            key="revenge_tilt",
            name="Revenge & Tilt Propensity",
            score=round(revenge_score, 1),
            status=classify(revenge_score),
            description="Emotional urge to fight the market immediately following losses."
        ),
        BiasDimension(
            key="overconfidence",
            name="Overconfidence & Hot-Hand",
            score=round(overconfidence_score, 1),
            status=classify(overconfidence_score),
            description="Attributing winning streaks to personal genius rather than market tailwinds."
        ),
        BiasDimension(
            key="gamblers_fallacy",
            name="Gambler's Fallacy",
            score=round(gambler_fallacy_score, 1),
            status=classify(gambler_fallacy_score),
            description="Mistaken belief that previous independent market candles force future reversals."
        ),
        BiasDimension(
            key="fomo_regret",
            name="FOMO & Regret Aversion",
            score=round(fomo_regret_score, 1),
            status=classify(fomo_regret_score),
            description="Fear of missing out leading to late chasing and hesitation at valid entry triggers."
        ),
    ]
    
    # Overall vulnerability: weighted average
    weights = [0.22, 0.20, 0.20, 0.14, 0.12, 0.12]
    scores = [d.score for d in dimensions]
    overall_score = round(float(np.dot(scores, weights)), 1)
    
    # Archetype determination
    highest_bias = max(dimensions, key=lambda d: d.score)
    if overall_score < 35.0:
        archetype = "Disciplined Systematic Operator"
    elif highest_bias.key in ("loss_aversion", "disposition_effect"):
        archetype = "The Asymmetric Bleeder (Holds Losers, Clips Winners)"
    elif highest_bias.key in ("revenge_tilt", "overconfidence"):
        archetype = "The Emotional Gunslinger (Volatile Position Sizer)"
    elif highest_bias.key == "fomo_regret":
        archetype = "The Hesitant Chaser (Late Entries & Analysis Paralysis)"
    else:
        archetype = "The Gambler-Intuitive (Pattern Fallacy Driven)"

    strengths: List[str] = []
    critical_traps: List[str] = []
    protocol: List[str] = []
    
    for d in dimensions:
        if d.score <= 35.0:
            strengths.append(f"Strong mental insulation against {d.name}.")
        elif d.score >= 65.0:
            critical_traps.append(f"High risk exposure to {d.name}: {d.description}")
            
    if not strengths:
        strengths.append("High awareness of existing psychological vulnerabilities across all metrics.")
    if not critical_traps:
        critical_traps.append("Low overall vulnerability detected; beware of latent complacency during extended winning runs.")

    protocol = [
        "Rule 1: Pre-calculate hard stop-loss and limit orders before entering any trade; do not adjust stops wider under any circumstance.",
        f"Rule 2: Address Disposition Ratio ({disposition_ratio}x): Require a minimum 2:1 profit target to stop distance before executing.",
        "Rule 3: Circuit Breaker: Enforce an automated hard daily loss limit of 3R. When reached, close charting software for the session.",
        "Rule 4: Keep a real-time emotional log rating mental fatigue and impulse score before every order submission."
    ]

    return BiasDiagnosisResponse(
        overall_vulnerability_score=overall_score,
        archetype=archetype,
        disposition_effect_ratio=disposition_ratio,
        dimensions=dimensions,
        strengths=strengths,
        critical_traps=critical_traps,
        action_protocol=protocol,
    )
