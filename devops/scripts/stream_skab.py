#!/usr/bin/env python3
import argparse
import csv
import json
import sys
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def post_event(url: str, payload: dict):
    body = json.dumps(payload).encode("utf-8")
    req = Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urlopen(req, timeout=10) as response:
            return response.read().decode("utf-8")
    except HTTPError as exc:
        print(f"HTTP error {exc.code}: {exc.reason}")
    except URLError as exc:
        print(f"Connection error: {exc}")
    except Exception as exc:
        print(f"Unexpected error: {exc}")
    return None


def stream_csv_file(file_path: Path, url: str, source_id: str, delay: float, limit: int):
    with file_path.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter=";")
        count = 0
        for row in reader:
            event = {
                "timestamp": row.get("datetime"),
                "source_id": source_id,
                "machine": source_id,
                "sensor_values": {
                    "Accelerometer1RMS": float(row.get("Accelerometer1RMS", "0") or 0),
                    "Accelerometer2RMS": float(row.get("Accelerometer2RMS", "0") or 0),
                    "Current": float(row.get("Current", "0") or 0),
                    "Pressure": float(row.get("Pressure", "0") or 0),
                    "Temperature": float(row.get("Temperature", "0") or 0),
                    "Thermocouple": float(row.get("Thermocouple", "0") or 0),
                    "Voltage": float(row.get("Voltage", "0") or 0),
                    "Volume_Flow_RateRMS": float(row.get("Volume Flow RateRMS", "0") or 0),
                },
                "anomaly": float(row.get("anomaly", "0") or 0),
                "changepoint": float(row.get("changepoint", "0") or 0),
                "metadata": {
                    "file": file_path.name,
                    "category": file_path.parent.name,
                },
            }
            print(f"Sending event {count+1} from {source_id} ({file_path.name})")
            post_event(url, event)
            count += 1
            if limit and count >= limit:
                break
            time.sleep(delay)
    return count


def find_skab_csv_files(dataset_root: Path):
    data_dir = dataset_root / "SKAB"
    if not data_dir.exists():
        raise FileNotFoundError(f"SKAB dataset root not found: {data_dir}")
    return sorted(data_dir.rglob("*.csv"))


def main():
    parser = argparse.ArgumentParser(description="Stream SKAB dataset rows as real-time events to the backend.")
    parser.add_argument("--dataset-path", type=Path, default=Path.home() / ".cache" / "kagglehub" / "datasets" / "yuriykatser" / "skoltech-anomaly-benchmark-skab" / "versions" / "1",
                        help="Root path to the downloaded SKAB dataset")
    parser.add_argument("--backend-url", default="http://localhost:8000/api/stream/event",
                        help="Backend event ingestion endpoint")
    parser.add_argument("--delay", type=float, default=1.0,
                        help="Delay in seconds between events")
    parser.add_argument("--limit", type=int, default=0,
                        help="Maximum number of events per file (0 = all)")
    parser.add_argument("--once", action="store_true",
                        help="Stop after one full pass through the dataset")
    args = parser.parse_args()

    print(f"Using dataset path: {args.dataset_path}")
    print(f"Sending events to: {args.backend_url}")

    csv_files = find_skab_csv_files(args.dataset_path)
    if not csv_files:
        print("No CSV files found in SKAB dataset.")
        sys.exit(1)

    print(f"Found {len(csv_files)} CSV files. Streaming data...")
    while True:
        for csv_file in csv_files:
            source_id = f"skab:{csv_file.parent.name}:{csv_file.stem}"
            streamed = stream_csv_file(csv_file, args.backend_url, source_id, args.delay, args.limit)
            if streamed == 0:
                print(f"No rows found in {csv_file}")
        if args.once:
            break

    print("Finished streaming SKAB data.")


if __name__ == "__main__":
    main()
