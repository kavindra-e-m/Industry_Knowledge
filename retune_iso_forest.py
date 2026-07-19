"""
Retune Isolation Forest contamination parameter.
Picks the contamination value with the best F1 on SKAB labelled data.
"""
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import f1_score, classification_report

DATA   = Path("data/raw/skab")
MODELS = Path("ml/predictive_maintenance/models")

SENSOR_COLS = [
    "Accelerometer1RMS", "Accelerometer2RMS", "Current", "Pressure",
    "Temperature", "Thermocouple", "Voltage", "Volume Flow RateRMS",
]

# ---- Load SKAB ----
dfs = []
for f in sorted(DATA.glob("*.csv")):
    for sep in [";", ","]:
        try:
            df = pd.read_csv(f, sep=sep)
            if df.shape[1] > 2:
                dfs.append(df)
                break
        except Exception:
            pass

skab = pd.concat(dfs, ignore_index=True)
for col in SENSOR_COLS:
    if col not in skab.columns:
        skab[col] = 0.0

X = skab[SENSOR_COLS].fillna(0).replace([np.inf, -np.inf], 0)
y_true = skab["anomaly"].fillna(0).astype(int).values if "anomaly" in skab.columns else None

print(f"SKAB: {len(X)} rows, anomaly rate {y_true.mean():.1%}")
print("\nSearching best contamination...")

# ---- Grid search ----
best_f1, best_cont, best_iso, best_sc = 0, 0.05, None, None
for cont in [0.03, 0.05, 0.07, 0.10, 0.15, 0.20]:
    sc  = StandardScaler()
    Xs  = sc.fit_transform(X)
    iso = IsolationForest(n_estimators=200, contamination=cont, random_state=42, n_jobs=-1)
    iso.fit(Xs)
    if y_true is not None:
        y_pred = (iso.predict(Xs) == -1).astype(int)
        f1 = f1_score(y_true, y_pred)
        print(f"  contamination={cont:.2f}  F1={f1:.4f}")
        if f1 > best_f1:
            best_f1, best_cont = f1, cont
            best_iso, best_sc  = iso, sc
    else:
        best_iso, best_sc = iso, sc
        break

print(f"\nBest: contamination={best_cont}  F1={best_f1:.4f}")
print(classification_report(
    y_true,
    (best_iso.predict(best_sc.transform(X)) == -1).astype(int),
    target_names=["Normal", "Anomaly"]
))

# ---- Save ----
joblib.dump(best_iso, MODELS / "iso_forest.pkl")
joblib.dump(best_sc,  MODELS / "iso_scaler.pkl")
print("Saved: iso_forest.pkl + iso_scaler.pkl")

# ---- Sanity test with real representative values from SKAB dataset ----
print("\n--- Sanity Tests ---")
# Normal sample based on actual dataset ranges (from row 0 of valve1/0.csv)
s_n  = np.array([[0.026588, 0.040111, 1.3302, 0.054711, 79.3366, 26.0199, 233.062, 32.0]])
pred = best_iso.predict(best_sc.transform(s_n))[0]
print(f"Normal sensors  -> {'ANOMALY' if pred == -1 else 'NORMAL'}  (expect NORMAL)")

# Anomalous sample based on actual dataset ranges (from row 573 of valve1/0.csv with high pressure, low current/voltage)
s_h  = np.array([[0.027033, 0.040534, 0.839896, 0.382638, 78.6736, 25.9506, 219.573, 32.0]])
pred = best_iso.predict(best_sc.transform(s_h))[0]
print(f"Spiked sensors  -> {'ANOMALY' if pred == -1 else 'NORMAL'}  (expect ANOMALY)")
