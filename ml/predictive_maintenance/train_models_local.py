"""
IndustrialBrain -- Local Training Script (ASCII-safe for Windows cp1252)
Downloads real datasets from public URLs (no Kaggle JSON needed):
  - AI4I 2020: UCI ML Repository
  - SKAB: GitHub raw CSVs (Skoltech Anomaly Benchmark)

Trains:
  1. Random Forest failure classifier  -> failure_rf_model.pkl + scaler.pkl
  2. Isolation Forest anomaly detector -> iso_forest.pkl + iso_scaler.pkl
"""

import sys
import json
import time
import urllib.request
import io
import zipfile
from pathlib import Path

# Force UTF-8 output to avoid cp1252 crash on Windows
import io as _io
sys.stdout = _io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, f1_score

# ------------------------------------------------------------------
# Paths
# ------------------------------------------------------------------
BASE   = Path(__file__).resolve().parents[2]
DATA   = BASE / "data" / "raw"
MODELS = BASE / "ml" / "predictive_maintenance" / "models"
DATA.mkdir(parents=True, exist_ok=True)
MODELS.mkdir(parents=True, exist_ok=True)

# ------------------------------------------------------------------
# Dataset URLs (all public, no auth required)
# ------------------------------------------------------------------
AI4I_URL  = "https://archive.ics.uci.edu/static/public/601/ai4i+2020+predictive+maintenance+dataset.zip"
SKAB_BASE = "https://raw.githubusercontent.com/waico/SKAB/master/data/valve1/"
SKAB_FILES = [f"{i}.csv" for i in range(12)]

SEP = "-" * 50


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------
def download(url: str, dest: Path, label: str) -> bool:
    if dest.exists() and dest.stat().st_size > 1000:
        print(f"  [cache] {label}")
        return True
    print(f"  [download] {label} ...", end=" ", flush=True)
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = resp.read()
        dest.write_bytes(data)
        print(f"OK ({len(data)//1024} KB)")
        return True
    except Exception as e:
        print(f"FAILED: {e}")
        return False


# ------------------------------------------------------------------
# 1. AI4I 2020 Dataset
# ------------------------------------------------------------------
def load_ai4i() -> pd.DataFrame:
    print(f"\n{SEP}")
    print("STEP 1: AI4I 2020 Predictive Maintenance Dataset")
    print("  Source: UCI Machine Learning Repository")
    print(SEP)

    zip_path = DATA / "ai4i2020.zip"
    ok = download(AI4I_URL, zip_path, "AI4I 2020")

    if ok and zip_path.exists():
        try:
            with zipfile.ZipFile(zip_path) as zf:
                csv_names = [n for n in zf.namelist() if n.lower().endswith(".csv")]
                print(f"  Files in ZIP: {csv_names}")
                if csv_names:
                    with zf.open(csv_names[0]) as f:
                        df = pd.read_csv(f)
                    print(f"  Loaded AI4I: {df.shape[0]} rows x {df.shape[1]} cols")
                    if "Machine failure" in df.columns:
                        print(f"  Failure rate: {df['Machine failure'].mean():.1%}")
                    return df
        except Exception as e:
            print(f"  ZIP extract failed: {e}")

    # Try cached CSV
    for name in ["ai4i2020.csv", "predictive_maintenance.csv"]:
        p = DATA / name
        if p.exists():
            df = pd.read_csv(p)
            print(f"  Loaded from cache: {df.shape}")
            return df

    print("  WARNING: Download failed. Using realistic synthetic fallback.")
    return _synthetic_ai4i()


def _synthetic_ai4i() -> pd.DataFrame:
    rng = np.random.RandomState(42)
    n   = 10_000
    air  = rng.normal(298.1, 2.0, n)
    proc = air + rng.normal(10.5, 0.5, n)
    rpm  = rng.normal(1538, 179, n).clip(1168, 2886)
    torq = rng.normal(40.0, 10.0, n).clip(3.8, 76.6)
    wear = rng.uniform(0, 250, n)
    power = rpm * torq
    tool_fail = (wear > 200) & (rng.rand(n) < 0.10)
    heat_fail = ((proc - air) < 8.6) & (power < 3500) & (rng.rand(n) < 0.08)
    overload  = (power > 9000) & (rng.rand(n) < 0.12)
    failure   = (tool_fail | heat_fail | overload).astype(int)
    df = pd.DataFrame({
        "Air temperature [K]":      air,
        "Process temperature [K]":  proc,
        "Rotational speed [rpm]":   rpm,
        "Torque [Nm]":              torq,
        "Tool wear [min]":          wear,
        "Machine failure":          failure,
    })
    print(f"  Synthetic AI4I: {n} rows, failure rate {failure.mean():.1%}")
    return df


# ------------------------------------------------------------------
# 2. SKAB Dataset
# ------------------------------------------------------------------
def load_skab() -> pd.DataFrame:
    print(f"\n{SEP}")
    print("STEP 2: SKAB -- Skoltech Anomaly Benchmark")
    print("  Source: github.com/waico/SKAB (valve1 series)")
    print(SEP)

    skab_dir = DATA / "skab"
    skab_dir.mkdir(exist_ok=True, parents=True)
    dfs = []

    for i, fname in enumerate(SKAB_FILES):
        print(f"  Fetching {fname} ({i+1}/{len(SKAB_FILES)}) ...", end=" ", flush=True)
        dest = skab_dir / fname
        ok = download(SKAB_BASE + fname, dest, fname)
        if ok and dest.exists():
            for sep in [";", ","]:
                try:
                    df = pd.read_csv(dest, sep=sep)
                    if df.shape[1] > 2:
                        dfs.append(df)
                        break
                except Exception:
                    pass

    if dfs:
        combined = pd.concat(dfs, ignore_index=True)
        print(f"\n  Loaded SKAB: {combined.shape[0]} rows x {combined.shape[1]} cols")
        if "anomaly" in combined.columns:
            print(f"  Anomaly rate: {combined['anomaly'].mean():.1%}")
        return combined

    print("\n  WARNING: Download failed. Using realistic synthetic fallback.")
    return _synthetic_skab()


def _synthetic_skab() -> pd.DataFrame:
    rng = np.random.RandomState(42)
    n   = 34_000
    df  = pd.DataFrame({
        "Accelerometer1RMS":   rng.exponential(0.5, n),
        "Accelerometer2RMS":   rng.exponential(0.4, n),
        "Current":             rng.normal(5.0, 0.8, n).clip(0),
        "Pressure":            rng.normal(1.5, 0.15, n).clip(0),
        "Temperature":         rng.normal(60, 5, n),
        "Thermocouple":        rng.normal(65, 6, n),
        "Voltage":             rng.normal(220, 3, n),
        "Volume Flow RateRMS": rng.normal(0.5, 0.05, n).clip(0),
        "anomaly":             np.zeros(n, int),
    })
    for start, dur in [(1000,120),(5000,80),(10000,200),(18000,50),(25000,100),(30000,150)]:
        end = min(start + dur, n)
        df.loc[start:end, "Accelerometer1RMS"] *= rng.uniform(3, 6)
        df.loc[start:end, "Pressure"]          *= rng.uniform(1.5, 2.5)
        df.loc[start:end, "Current"]           *= rng.uniform(1.3, 2.0)
        df.loc[start:end, "anomaly"]            = 1
    print(f"  Synthetic SKAB: {n} rows, anomaly rate {df['anomaly'].mean():.1%}")
    return df


# ------------------------------------------------------------------
# 3. Random Forest
# ------------------------------------------------------------------
RENAME = {
    "Air temperature [K]":      "air_temperature_k",
    "Process temperature [K]":  "process_temperature_k",
    "Rotational speed [rpm]":   "rotational_speed_rpm",
    "Torque [Nm]":              "torque_nm",
    "Tool wear [min]":          "tool_wear_min",
}
FEAT_COLS = [
    "air_temperature_k", "process_temperature_k",
    "rotational_speed_rpm", "torque_nm", "tool_wear_min",
    "days_since_maintenance", "overdue_days",
    "emergency_count_6m", "corrective_ratio",
]


def add_maintenance_features(df):
    rng = np.random.RandomState(42)
    n   = len(df)
    df  = df.copy()
    df["days_since_maintenance"] = rng.randint(1, 365, n)
    df["overdue_days"]           = ((df["days_since_maintenance"] > 180).astype(int)
                                    * rng.randint(0, 90, n))
    df["emergency_count_6m"]     = rng.randint(0, 5, n)
    df["corrective_ratio"]       = rng.uniform(0, 1, n)
    return df


def train_random_forest(df):
    print(f"\n{SEP}")
    print("STEP 3: Training Random Forest Classifier")
    print(SEP)

    df = df.rename(columns=RENAME)
    df = add_maintenance_features(df)

    X = df[FEAT_COLS].fillna(df[FEAT_COLS].median())
    y = df["Machine failure"]

    print(f"  Samples : {len(X)}")
    print(f"  Failures: {int(y.sum())} ({y.mean():.1%})")

    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y)
    scaler    = StandardScaler()
    X_tr_s   = scaler.fit_transform(X_tr)
    X_te_s   = scaler.transform(X_te)

    print("  Training RandomForest (200 trees, balanced, all CPU cores)...")
    t0 = time.time()
    rf = RandomForestClassifier(
        n_estimators=200, max_depth=12, min_samples_leaf=5,
        class_weight="balanced", random_state=42, n_jobs=-1)
    rf.fit(X_tr_s, y_tr)
    dt = time.time() - t0

    y_pred = rf.predict(X_te_s)
    f1     = f1_score(y_te, y_pred)
    print(f"  Done in {dt:.1f}s  |  Test F1: {f1:.4f}")
    print("\n  Classification Report:")
    print(classification_report(y_te, y_pred, target_names=["No Failure","Failure"]))

    print("  Top Feature Importances:")
    for feat, imp in sorted(zip(FEAT_COLS, rf.feature_importances_), key=lambda x: -x[1]):
        bar = "#" * int(imp * 40)
        print(f"    {feat:35s} {bar:40s} {imp:.3f}")

    return rf, scaler


# ------------------------------------------------------------------
# 4. Isolation Forest
# ------------------------------------------------------------------
SENSOR_COLS = [
    "Accelerometer1RMS","Accelerometer2RMS","Current","Pressure",
    "Temperature","Thermocouple","Voltage","Volume Flow RateRMS",
]


def train_isolation_forest(df):
    print(f"\n{SEP}")
    print("STEP 4: Training Isolation Forest Anomaly Detector")
    print(SEP)

    for col in SENSOR_COLS:
        if col not in df.columns:
            df[col] = 0.0

    X = df[SENSOR_COLS].fillna(0).replace([np.inf, -np.inf], 0)
    print(f"  Samples: {len(X)}")

    contamination = 0.10
    print(f"  Contamination: {contamination:.3f}")

    iso_scaler = StandardScaler()
    X_s = iso_scaler.fit_transform(X)

    print(f"  Training IsolationForest (200 trees, contamination={contamination:.3f})...")
    t0  = time.time()
    iso = IsolationForest(
        n_estimators=200, contamination=contamination,
        random_state=42, n_jobs=-1)
    iso.fit(X_s)
    dt = time.time() - t0
    print(f"  Done in {dt:.1f}s")

    if "anomaly" in df.columns:
        y_true = df["anomaly"].fillna(0).astype(int).values
        y_pred = (iso.predict(X_s) == -1).astype(int)
        f1 = f1_score(y_true, y_pred)
        print(f"  F1 on labelled anomalies: {f1:.4f}")
        print("\n  Classification Report:")
        print(classification_report(y_true, y_pred, target_names=["Normal","Anomaly"]))

    return iso, iso_scaler


# ------------------------------------------------------------------
# 5. Save
# ------------------------------------------------------------------
def save_models(rf, scaler, iso, iso_scaler):
    print(f"\n{SEP}")
    print("STEP 5: Saving Models")
    print(SEP)
    for name, obj in [
        ("failure_rf_model.pkl", rf),
        ("scaler.pkl",           scaler),
        ("iso_forest.pkl",       iso),
        ("iso_scaler.pkl",       iso_scaler),
    ]:
        path = MODELS / name
        joblib.dump(obj, path)
        print(f"  OK  {name:35s} {path.stat().st_size//1024:5d} KB")

    meta = {
        "rf_features":  FEAT_COLS,
        "iso_features": SENSOR_COLS,
        "trained_on": {
            "rf":  "AI4I 2020 Predictive Maintenance Dataset (UCI ML Repository)",
            "iso": "SKAB Skoltech Anomaly Benchmark (github.com/waico/SKAB)",
        },
        "trained_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "hardware": "CPU only",
    }
    meta_path = MODELS / "model_metadata.json"
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)
    print(f"  OK  model_metadata.json")


# ------------------------------------------------------------------
# 6. Sanity test
# ------------------------------------------------------------------
def sanity_test(rf, scaler, iso, iso_scaler):
    print(f"\n{SEP}")
    print("STEP 6: Sanity Tests")
    print(SEP)

    # RF -- normal
    x_n = np.array([[298.0, 308.0, 1500, 35, 50, 30, 0, 0, 0.1]])
    p_n = rf.predict_proba(scaler.transform(x_n))[0][1]
    print(f"  Normal equip   -> failure prob: {p_n:.3f}  (expect < 0.20)")

    # RF -- at risk
    x_h = np.array([[305.0, 314.0, 1150, 65, 230, 200, 45, 3, 0.8]])
    p_h = rf.predict_proba(scaler.transform(x_h))[0][1]
    print(f"  At-risk equip  -> failure prob: {p_h:.3f}  (expect > 0.40)")

    # ISO -- normal sensors
    s_n = np.array([[0.027, 0.040, 0.98, 0.070, 71.0, 25.2, 230.8, 31.5]])
    a_n = iso.predict(iso_scaler.transform(s_n))[0]
    print(f"  Normal sensors -> prediction: {'ANOMALY' if a_n == -1 else 'NORMAL'}  (expect NORMAL)")

    # ISO -- spiked sensors
    s_h = np.array([[0.10, 0.10, 5.0, 1.5, 90.0, 35.0, 260.0, 35.0]])
    a_h = iso.predict(iso_scaler.transform(s_h))[0]
    print(f"  Spiked sensors -> prediction: {'ANOMALY' if a_h == -1 else 'NORMAL'}  (expect ANOMALY)")

    print("\n  All sanity tests done.")


def main():
    print("=" * 50)
    print("IndustrialBrain -- Model Training")
    print("Hardware: CPU only (no CUDA required)")
    print("=" * 50)
    t_start = time.time()

    ai4i_df = load_ai4i()
    skab_df = load_skab()

    rf, scaler      = train_random_forest(ai4i_df)
    iso, iso_scaler = train_isolation_forest(skab_df)

    save_models(rf, scaler, iso, iso_scaler)
    sanity_test(rf, scaler, iso, iso_scaler)

    print(f"\n{'=' * 50}")
    print(f"Training complete in {time.time()-t_start:.1f}s")
    print(f"Models saved to: {MODELS}")
    print("=" * 50)


if __name__ == "__main__":
    main()
