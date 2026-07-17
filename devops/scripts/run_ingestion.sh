#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

echo "Triggering document ingestion pipeline..."
echo "This repository currently uses placeholder data; extend the ingestion entrypoint as your pipeline matures."
