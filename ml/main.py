from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any
import numpy as np
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib
import os
import math
import json
from datetime import datetime

app = FastAPI(title="Supply Chain ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---
class TransferRecord(BaseModel):
    from_address: Optional[str] = None
    to: Optional[str] = None
    location: Optional[str] = None
    timestamp: Optional[Any] = None
    notes: Optional[str] = None

class NewTransfer(BaseModel):
    from_address: Optional[str] = None
    to: Optional[str] = None
    location: Optional[str] = None
    timestamp: Optional[Any] = None

class PredictRequest(BaseModel):
    tokenId: str
    transferHistory: Optional[List[Any]] = []
    newTransfer: Optional[Any] = None

class PredictResponse(BaseModel):
    tokenId: str
    risk_score: float
    risk_level: str
    flags: List[str]
    recommendation: str

# --- Feature Extraction ---
SUSPICIOUS_LOCATION_PAIRS = [
    ("mumbai", "usa"), ("pune", "london"), ("delhi", "tokyo"),
    ("india", "usa"), ("india", "europe")
]

def haversine_distance(loc1: str, loc2: str) -> float:
    """Approximate distance heuristic based on known city coords."""
    CITY_COORDS = {
        "mumbai": (19.0760, 72.8777),
        "pune": (18.5204, 73.8567),
        "delhi": (28.6139, 77.2090),
        "bangalore": (12.9716, 77.5946),
        "kolhapur": (16.7050, 74.2433),
        "usa": (37.0902, -95.7129),
        "london": (51.5074, -0.1278),
        "tokyo": (35.6895, 139.6917),
        "europe": (54.5260, 15.2551),
        "india": (20.5937, 78.9629),
    }
    l1 = loc1.lower().strip() if loc1 else ""
    l2 = loc2.lower().strip() if loc2 else ""
    c1 = CITY_COORDS.get(l1, (0, 0))
    c2 = CITY_COORDS.get(l2, (0, 0))
    if c1 == (0, 0) or c2 == (0, 0):
        return 0.0
    lat1, lon1 = math.radians(c1[0]), math.radians(c1[1])
    lat2, lon2 = math.radians(c2[0]), math.radians(c2[1])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dlon/2)**2
    return 6371 * 2 * math.asin(math.sqrt(a))

def extract_features(history: list, new_transfer: dict) -> dict:
    features = {}
    n = len(history)
    features["num_transfers"] = n

    # Time gaps between transfers
    timestamps = []
    for record in history:
        ts = record.get("timestamp", 0)
        if isinstance(ts, str):
            try:
                ts = datetime.fromisoformat(ts).timestamp() * 1000
            except:
                ts = 0
        timestamps.append(float(ts) if ts else 0)

    if new_transfer:
        ts = new_transfer.get("timestamp", 0)
        timestamps.append(float(ts) if ts else 0)

    time_gaps = [timestamps[i+1] - timestamps[i] for i in range(len(timestamps)-1) if timestamps[i] > 0 and timestamps[i+1] > 0]
    features["min_time_gap_hours"] = min(time_gaps) / 3600000 if time_gaps else 999
    features["avg_time_gap_hours"] = sum(time_gaps) / len(time_gaps) / 3600000 if time_gaps else 999

    # Location jump distance
    locations = [r.get("location", "") for r in history]
    if new_transfer:
        locations.append(new_transfer.get("location", ""))

    max_dist = 0
    for i in range(len(locations)-1):
        dist = haversine_distance(locations[i], locations[i+1])
        max_dist = max(max_dist, dist)
    features["max_location_jump_km"] = max_dist

    # Unique owners
    owners = set()
    for r in history:
        if r.get("to"): owners.add(r.get("to"))
        if r.get("from"): owners.add(r.get("from"))
    features["unique_owners"] = len(owners)

    # Duplicate location check
    loc_set = set(l.lower().strip() for l in locations if l)
    features["unique_locations"] = len(loc_set)
    features["location_reuse"] = 1 if len(loc_set) < len(locations) else 0

    return features

def rule_based_flags(features: dict, history: list, new_transfer: dict) -> List[str]:
    flags = []
    if features["min_time_gap_hours"] < 1 and features["num_transfers"] > 1:
        flags.append("Abnormally fast transfer (< 1 hour between transfers)")
    if features["max_location_jump_km"] > 5000:
        flags.append(f"Suspicious location jump ({features['max_location_jump_km']:.0f} km in short time)")
    if features["num_transfers"] > 10:
        flags.append("Unusually high number of transfers")
    if features["location_reuse"]:
        flags.append("Same location used multiple times (possible loop)")
    if features["unique_owners"] > 8:
        flags.append("Too many unique owners detected")
    return flags

def compute_risk_score(features: dict, flags: List[str]) -> float:
    score = 0.0
    # Fast transfers
    if features["min_time_gap_hours"] < 1:
        score += 40
    elif features["min_time_gap_hours"] < 6:
        score += 20
    # Location jumps
    if features["max_location_jump_km"] > 5000:
        score += 35
    elif features["max_location_jump_km"] > 2000:
        score += 15
    # Transfer count
    if features["num_transfers"] > 10:
        score += 10
    # Location reuse
    if features["location_reuse"]:
        score += 10
    # Extra for many owners
    if features["unique_owners"] > 8:
        score += 10
    return min(score, 100.0)

# --- Isolation Forest (unsupervised anomaly detection) ---
# Trained on synthetic "normal" supply chain data
def build_isolation_forest():
    np.random.seed(42)
    # Simulate 500 normal transfer patterns
    normal_data = np.column_stack([
        np.random.randint(2, 6, 500),          # num_transfers
        np.random.uniform(12, 72, 500),         # min_time_gap_hours
        np.random.uniform(100, 1500, 500),      # max_location_jump_km
        np.random.randint(2, 5, 500),           # unique_owners
        np.zeros(500),                          # location_reuse
    ])
    model = IsolationForest(contamination=0.1, random_state=42)
    model.fit(normal_data)
    return model

isolation_model = build_isolation_forest()

def isolation_score(features: dict) -> float:
    X = np.array([[
        features["num_transfers"],
        features["min_time_gap_hours"],
        features["max_location_jump_km"],
        features["unique_owners"],
        features["location_reuse"]
    ]])
    score = isolation_model.decision_function(X)[0]
    # Convert to 0-100 range (more negative = more anomalous)
    normalized = max(0, min(100, (0.5 - score) * 100))
    return float(normalized)

# --- API Endpoints ---
@app.get("/health")
def health():
    return {"status": "ok", "model": "IsolationForest + RuleEngine", "version": "1.0.0"}

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    history = req.transferHistory or []
    new_transfer = req.newTransfer or {}

    # Convert pydantic objects to dicts if needed
    if hasattr(new_transfer, "dict"):
        new_transfer = new_transfer.dict()

    features = extract_features(history, new_transfer)
    flags = rule_based_flags(features, history, new_transfer)
    rule_score = compute_risk_score(features, flags)
    iso_score = isolation_score(features)

    # Weighted ensemble
    final_score = round(0.6 * rule_score + 0.4 * iso_score, 1)

    if final_score >= 70:
        risk_level = "HIGH"
        recommendation = "Flag for manual inspection. Do not proceed with transfer."
    elif final_score >= 40:
        risk_level = "MEDIUM"
        recommendation = "Review transfer history carefully before proceeding."
    else:
        risk_level = "LOW"
        recommendation = "Transfer appears normal. Safe to proceed."

    return PredictResponse(
        tokenId=req.tokenId,
        risk_score=final_score,
        risk_level=risk_level,
        flags=flags,
        recommendation=recommendation
    )

@app.post("/batch-predict")
def batch_predict(requests: List[PredictRequest]):
    return [predict(r) for r in requests]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
