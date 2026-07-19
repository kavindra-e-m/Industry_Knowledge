"""
Training script for predictive maintenance models.
Downloads AI4I 2020 + SKAB datasets and trains:
  1. Random Forest failure classifier
  2. Isolation Forest anomaly detector

Run this from project root after placing kaggle.json at ~/.kaggle/kaggle.json
Or run the Colab notebook: ml/notebooks/01_train_predictive_maintenance.ipynb
Owner: Member 2 — ML & Document Intelligence Lead
"""
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
from loguru import logger

MODEL_DIR = Path("ml/predictive_maintenance/models")
MODEL_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# AI4I 2020 Dataset — feature columns
# ---------------------------------------------------------------------------
AI4I_FEATURES = [
    "Air temperature [K]",
    "Process temperature [K]",
    "Rotational speed [rpm]",
    "Torque [Nm]",
    "Tool wear [min]",
]

# Rename to match our internal schema
RENAME_MAP = {
    "Air temperature [K]": "air_temperature_k",
    "Process temperature [K]": "process_temperature_k",
    "Rotational speed [rpm]": "rotational_speed_rpm",
    "Torque [Nm]": "torque_nm",
    "Tool wear [min]": "tool_wear_min",
}

AI4I_TARGET = "Machine failure"


def download_ai4i_dataset(data_dir: Path) -> Path:
    """Download AI4I 2020 Predictive Maintenance Dataset from Kaggle."""
    import kaggle
    logger.info("Downloading AI4I 2020 dataset from Kaggle...")
    kaggle.api.dataset_download_files(
        "stephanmatzka/predictive-maintenance-dataset-ai4i-2020",
        path=str(data_dir),
        unzip=True,
    )
    # Try common filenames
    for name in ["ai4i2020.csv", "ai4i_2020.csv", "predictive_maintenance.csv"]:
        csv_path = data_dir / name
        if csv_path.exists():
            logger.success(f"AI4I dataset downloaded: {csv_path}")
            return csv_path
    # Fallback — find any CSV
    csvs = list(data_dir.glob("*.csv"))
    if csvs:
        return csvs[0]
    raise FileNotFoundError("AI4I CSV not found after download")


def load_ai4i(data_dir: Path) -> pd.DataFrame:
    """Load AI4I dataset, downloading if needed."""
    # Check if already downloaded
    for name in ["ai4i2020.csv", "ai4i_2020.csv", "predictive_maintenance.csv"]:
        csv_path = data_dir / name
        if csv_path.exists():
            return pd.read_csv(csv_path)

    # Try Kaggle download
    try:
        csv_path = download_ai4i_dataset(data_dir)
        return pd.read_csv(csv_path)
    except Exception as e:
        logger.warning(f"Kaggle download failed: {e}. Generating synthetic fallback...")
        return _generate_synthetic_ai4i()


def _generate_synthetic_ai4i() -> pd.DataFrame:
    """Generate synthetic AI4I-style data as last resort fallback."""
    rng = np.random.RandomState(42)
    n = 10000
    df = pd.DataFrame({
        "Air temperature [K]": rng.normal(298.1, 2, n),
        "Process temperature [K]": rng.normal(308.6, 1.5, n),
        "Rotational speed [rpm]": rng.normal(1500, 200, n),
        "Torque [Nm]": rng.normal(40, 10, n),
        "Tool wear [min]": rng.uniform(0, 250, n),
    })
    # Synthetic failure: high torque + high wear + low speed
    failure_prob = (
        (df["Torque [Nm]"] > 55).astype(float) * 0.4 +
        (df["Tool wear [min]"] > 200).astype(float) * 0.3 +
        (df["Rotational speed [rpm]"] < 1200).astype(float) * 0.3
    )
    df["Machine failure"] = (rng.rand(n) < failure_prob.clip(0, 0.8)).astype(int)
    logger.warning("Using SYNTHETIC data — not real AI4I. Get Kaggle JSON for real training.")
    return df


def download_skab(data_dir: Path) -> list[Path]:
    """Download SKAB dataset from Kaggle."""
    import kaggle
    logger.info("Downloading SKAB dataset from Kaggle...")
    kaggle.api.dataset_download_files(
        "yuriykatser/skoltech-anomaly-benchmark-skab",
        path=str(data_dir),
        unzip=True,
    )
    csvs = list(data_dir.glob("**/*.csv"))
    logger.success(f"SKAB downloaded: {len(csvs)} files")
    return csvs


def load_skab(data_dir: Path) -> pd.DataFrame:
    """Load and concatenate all SKAB valve CSV files."""
    skab_dir = data_dir / "skab"
    if skab_dir.exists():
        csvs = list(skab_dir.glob("*.csv"))
    else:
        csvs = list(data_dir.glob("**/*.csv"))

    if not csvs:
        try:
            csvs = download_skab(data_dir)
        except Exception as e:
            logger.warning(f"SKAB download failed: {e}. Using synthetic fallback.")
            return _generate_synthetic_skab()

    dfs = []
    for csv in csvs:
        try:
            df = pd.read_csv(csv, sep=";")
            dfs.append(df)
        except Exception:
            pass

    if not dfs:
        return _generate_synthetic_skab()

    combined = pd.concat(dfs, ignore_index=True)
    logger.success(f"SKAB loaded: {len(combined)} rows from {len(dfs)} files")
    return combined


def _generate_synthetic_skab() -> pd.DataFrame:
    rng = np.random.RandomState(42)
    n = 34000
    df = pd.DataFrame({
        "Accelerometer1RMS": rng.exponential(1.0, n),
        "Accelerometer2RMS": rng.exponential(0.8, n),
        "Current": rng.normal(5.0, 1.5, n),
        "Pressure": rng.normal(1.5, 0.3, n),
        "Temperature": rng.normal(60, 10, n),
        "Thermocouple": rng.normal(65, 12, n),
        "Voltage": rng.normal(220, 5, n),
        "Volume Flow RateRMS": rng.normal(0.5, 0.1, n),
    })
    # Add anomaly spikes
    anomaly_idx = rng.choice(n, size=int(n * 0.05), replace=False)
    df.loc[anomaly_idx, "Accelerometer1RMS"] *= 4
    df.loc[anomaly_idx, "Pressure"] *= 2
    df["anomaly"] = 0
    df.loc[anomaly_idx, "anomaly"] = 1
    return df


# ---------------------------------------------------------------------------
# Training functions
# ---------------------------------------------------------------------------

def add_maintenance_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add maintenance history features to AI4I dataframe."""
    rng = np.random.RandomState(42)
    n = len(df)
    df = df.copy()
    df["days_since_maintenance"] = rng.randint(1, 365, n)
    df["overdue_days"] = (df["days_since_maintenance"] > 180).astype(int) * rng.randint(0, 90, n)
    df["emergency_count_6m"] = rng.randint(0, 5, n)
    df["corrective_ratio"] = rng.uniform(0, 1, n)
    return df


def train_random_forest(df: pd.DataFrame) -> tuple:
    """Train Random Forest on AI4I features."""
    logger.info("Training Random Forest classifier...")

    df = df.rename(columns=RENAME_MAP)
    df = add_maintenance_features(df)

    feature_cols = [
        "air_temperature_k", "process_temperature_k",
        "rotational_speed_rpm", "torque_nm", "tool_wear_min",
        "days_since_maintenance", "overdue_days",
        "emergency_count_6m", "corrective_ratio",
    ]

    X = df[feature_cols].fillna(df[feature_cols].median())
    y = df["Machine failure"] if "Machine failure" in df.columns else df.iloc[:, -1]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    rf = RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        min_samples_leaf=5,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    rf.fit(X_train_s, y_train)

    report = classification_report(y_test, rf.predict(X_test_s))
    logger.info(f"Random Forest — Test Report:\n{report}")

    return rf, scaler


def train_isolation_forest(df: pd.DataFrame) -> tuple:
    """Train Isolation Forest on SKAB sensor features."""
    logger.info("Training Isolation Forest anomaly detector...")

    sensor_cols = [
        "Accelerometer1RMS", "Accelerometer2RMS",
        "Current", "Pressure", "Temperature",
        "Thermocouple", "Voltage", "Volume Flow RateRMS",
    ]

    available = [c for c in sensor_cols if c in df.columns]
    if not available:
        logger.error("No matching SKAB columns found")
        return None, None

    X = df[available].fillna(0).replace([np.inf, -np.inf], 0)

    iso_scaler = StandardScaler()
    X_scaled = iso_scaler.fit_transform(X)

    iso = IsolationForest(
        n_estimators=200,
        contamination=0.05,  # ~5% anomaly rate in SKAB
        random_state=42,
        n_jobs=-1,
    )
    iso.fit(X_scaled)

    # Evaluate if labels available
    if "anomaly" in df.columns:
        y_true = df["anomaly"].fillna(0).astype(int)
        y_pred = (iso.predict(X_scaled) == -1).astype(int)
        from sklearn.metrics import f1_score
        f1 = f1_score(y_true, y_pred)
        logger.info(f"Isolation Forest F1 on labelled data: {f1:.3f}")

    logger.success("Isolation Forest trained")
    return iso, iso_scaler


def main():
    data_dir = Path("data/raw")
    data_dir.mkdir(parents=True, exist_ok=True)

    # ---- Train Random Forest ----
    logger.info("=== Step 1: Loading AI4I 2020 dataset ===")
    ai4i_df = load_ai4i(data_dir)
    logger.info(f"AI4I shape: {ai4i_df.shape}")

    rf_model, scaler = train_random_forest(ai4i_df)
    joblib.dump(rf_model, MODEL_DIR / "failure_rf_model.pkl")
    joblib.dump(scaler, MODEL_DIR / "scaler.pkl")
    logger.success("Random Forest saved")

    # ---- Train Isolation Forest ----
    logger.info("=== Step 2: Loading SKAB dataset ===")
    skab_df = load_skab(data_dir)
    logger.info(f"SKAB shape: {skab_df.shape}")

    iso_model, iso_scaler = train_isolation_forest(skab_df)
    if iso_model:
        joblib.dump(iso_model, MODEL_DIR / "iso_forest.pkl")
        joblib.dump(iso_scaler, MODEL_DIR / "iso_scaler.pkl")
        logger.success("Isolation Forest saved")

    # Save feature metadata
    meta = {
        "rf_features": [
            "air_temperature_k", "process_temperature_k",
            "rotational_speed_rpm", "torque_nm", "tool_wear_min",
            "days_since_maintenance", "overdue_days",
            "emergency_count_6m", "corrective_ratio",
        ],
        "iso_features": [
            "Accelerometer1RMS", "Accelerometer2RMS", "Current",
            "Pressure", "Temperature", "Thermocouple",
            "Voltage", "Volume Flow RateRMS",
        ],
        "trained_on": {
            "rf": "AI4I 2020 Predictive Maintenance Dataset (UCI/Kaggle)",
            "iso": "SKAB Skoltech Anomaly Benchmark (Kaggle)",
        },
    }
    with open(MODEL_DIR / "model_metadata.json", "w") as f:
        json.dump(meta, f, indent=2)

    logger.success("All models trained and saved to ml/predictive_maintenance/models/")
    logger.info("Next: Copy models to your local machine if trained on Colab.")


if __name__ == "__main__":
    main()
