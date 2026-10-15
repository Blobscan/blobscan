#!/usr/bin/env python3
"""Check that the blobscan-dagster Helm chart runs this app's Dagster version.

The chart's webserver and daemon use the upstream dagster/dagster-k8s image,
pinned by tag; the code location and run pods use this app's image, built from
uv.lock. When the two drift, the webserver and daemon talk to a code server on
another Dagster version.

Usage (from apps/dagster):
    uv run python scripts/check_chart_version.py [values.yaml URL or path]
"""

import sys
import tomllib
import urllib.request
from pathlib import Path

import yaml

DAGSTER_ROOT = Path(__file__).parent.parent
DEFAULT_VALUES = (
    "https://raw.githubusercontent.com/Blobscan/blobscan-helm-charts/"
    "master/charts/blobscan-dagster/values.yaml"
)


def locked_dagster_version() -> str:
    lock = tomllib.loads((DAGSTER_ROOT / "uv.lock").read_text())
    return next(p["version"] for p in lock["package"] if p["name"] == "dagster")


def load_values(source: str) -> dict:
    if source.startswith(("http://", "https://")):
        # Only http(s) gets here; anything else is read as a local path.
        with urllib.request.urlopen(source, timeout=30) as response:  # noqa: S310
            return yaml.safe_load(response.read())
    return yaml.safe_load(Path(source).read_text())


def main() -> int:
    source = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_VALUES
    locked = locked_dagster_version()
    values = load_values(source)

    mismatches = []
    for component in ("webserver", "daemon"):
        tag = str(values[component]["image"]["tag"])
        print(f"{component}: dagster/dagster-k8s:{tag}")
        if tag != locked:
            mismatches.append(component)

    print(f"uv.lock: dagster {locked}")
    if mismatches:
        print(
            f"::error::blobscan-dagster chart ({source}) runs "
            f"{', '.join(mismatches)} on a different Dagster version than "
            f"apps/dagster/uv.lock ({locked}). Release a chart with "
            f"webserver.image.tag and daemon.image.tag set to {locked}.",
        )
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
