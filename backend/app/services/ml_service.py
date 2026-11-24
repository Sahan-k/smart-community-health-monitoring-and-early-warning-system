from pathlib import Path
import joblib
import pandas as pd


# Project root:
# C:\smart-community-health-monitoring
PROJECT_ROOT = Path(__file__).resolve().parents[3]

MODEL_PATH = PROJECT_ROOT / "ml" / "models" / "risk_model.joblib"

# Load trained model once when the backend starts
model = joblib.load(MODEL_PATH)


def predict_risk(data: dict):
    """
    Predict Low / Medium / High health risk
    using the trained machine learning model.
    """

    df = pd.DataFrame([data])

    prediction = model.predict(df)[0]

    # Get model confidence if available
    confidence = None

    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba(df)[0]
        confidence = float(max(probabilities) * 100)

    return {
        "risk_level": str(prediction),
        "confidence": confidence
    }