from pathlib import Path

import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report


# -----------------------------
# Paths
# -----------------------------

BASE_DIR = Path(__file__).resolve().parent

DATASET_PATH = BASE_DIR / "dataset" / "community_health_dataset.csv"
MODEL_DIR = BASE_DIR / "models"
MODEL_PATH = MODEL_DIR / "risk_model.joblib"


# -----------------------------
# Load dataset
# -----------------------------

print("Loading dataset...")

df = pd.read_csv(DATASET_PATH)

print(f"Dataset shape: {df.shape}")


# -----------------------------
# Features
# -----------------------------

features = [
    "state",
    "district",
    "disease",
    "latitude",
    "longitude",
    "population",
    "previous_week_cases",
    "cases_2_weeks_ago",
    "cases_3_weeks_ago",
    "case_growth_rate",
    "fever_reports",
    "cough_reports",
    "diarrhea_reports",
    "headache_reports",
    "rash_reports",
    "respiratory_reports",
    "avg_temp_c",
    "rainfall_mm",
    "humidity_percent",
    "water_ph",
    "turbidity_ntu"
]

target = "future_risk"


# -----------------------------
# Prepare data
# -----------------------------

X = df[features]
y = df[target]


categorical_features = [
    "state",
    "district",
    "disease"
]

numeric_features = [
    feature for feature in features
    if feature not in categorical_features
]


# -----------------------------
# Preprocessing
# -----------------------------

preprocessor = ColumnTransformer(
    transformers=[
        (
            "categorical",
            OneHotEncoder(handle_unknown="ignore"),
            categorical_features
        ),
        (
            "numeric",
            "passthrough",
            numeric_features
        )
    ]
)


# -----------------------------
# Random Forest model
# -----------------------------

classifier = RandomForestClassifier(
    n_estimators=300,
    max_depth=18,
    min_samples_leaf=2,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1
)


# -----------------------------
# Complete ML pipeline
# -----------------------------

model = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        ("classifier", classifier)
    ]
)


# -----------------------------
# Train/test split
# -----------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


print("Training model...")

model.fit(X_train, y_train)


# -----------------------------
# Evaluation
# -----------------------------

predictions = model.predict(X_test)

accuracy = accuracy_score(y_test, predictions)

print("\nModel training completed!")
print(f"Accuracy: {accuracy * 100:.2f}%")

print("\nClassification Report:")
print(classification_report(y_test, predictions))


# -----------------------------
# Save model
# -----------------------------

MODEL_DIR.mkdir(parents=True, exist_ok=True)

joblib.dump(model, MODEL_PATH)

print("\nModel saved successfully!")
print(f"Model path: {MODEL_PATH}")