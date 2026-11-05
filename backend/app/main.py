"""FastAPI application entrypoint for The Trading Mind Analytics Backend."""

from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .models import (
    HealthResponse,
    ProspectTheoryRequest,
    ProspectTheoryResponse,
    MonteCarloRuinRequest,
    MonteCarloRuinResponse,
    TiltDecayRequest,
    TiltDecayResponse,
    BiasDiagnosisRequest,
    BiasDiagnosisResponse,
)
from .analytics import (
    compute_prospect_theory,
    compute_monte_carlo_ruin,
    compute_tilt_decay,
    compute_bias_diagnosis,
)

app = FastAPI(
    title="The Trading Mind - Analytics API",
    description="Quantitative behavioral finance and trading psychology simulation engine.",
    version="1.0.0",
)

# Enable CORS for browser access from any local server or file origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["System"])
def root_status() -> dict:
    """Root endpoint verifying API is running."""
    return {
        "name": "The Trading Mind Analytics API",
        "status": "online",
        "docs_url": "/docs",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/health", response_model=HealthResponse, tags=["System"])
def get_health() -> HealthResponse:
    """Health check endpoint to test connection from the presentation frontend."""
    return HealthResponse(
        status="ok",
        version="1.0.0",
        service="The Trading Mind Analytics Engine",
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@app.post("/api/simulate/prospect-theory", response_model=ProspectTheoryResponse, tags=["Simulations"])
def simulate_prospect_theory(params: ProspectTheoryRequest) -> ProspectTheoryResponse:
    """Calculates Kahneman-Tversky Prospect Theory subjective value function points."""
    try:
        return compute_prospect_theory(params)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prospect theory computation error: {str(e)}")


@app.post("/api/simulate/monte-carlo-ruin", response_model=MonteCarloRuinResponse, tags=["Simulations"])
def simulate_monte_carlo_ruin(params: MonteCarloRuinRequest) -> MonteCarloRuinResponse:
    """Runs a multi-path Monte Carlo risk-of-ruin simulation across trading equity paths."""
    try:
        return compute_monte_carlo_ruin(params)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Monte Carlo computation error: {str(e)}")


@app.post("/api/simulate/tilt-decay", response_model=TiltDecayResponse, tags=["Simulations"])
def simulate_tilt_decay(params: TiltDecayRequest) -> TiltDecayResponse:
    """Models emotional tilt escalation and decision quality deterioration."""
    try:
        return compute_tilt_decay(params)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Tilt decay computation error: {str(e)}")


@app.post("/api/analytics/diagnose-bias", response_model=BiasDiagnosisResponse, tags=["Analytics"])
def diagnose_bias(params: BiasDiagnosisRequest) -> BiasDiagnosisResponse:
    """Calculates multi-dimensional trader bias vulnerabilities and archetype profile."""
    try:
        return compute_bias_diagnosis(params)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Bias diagnosis error: {str(e)}")
