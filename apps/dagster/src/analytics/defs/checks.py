from datetime import UTC, date, datetime, timedelta

import dagster as dg
from sqlalchemy import Connection, text

from analytics.defs.assets import daily_metrics
from analytics.defs.resources.postgres import PostgresResource

# Completed days compared on each run.
LEGACY_PARITY_DAYS = 7

# Compares daily_metrics against the legacy daily_stats table (still served by
# the API) on the counters both pipelines compute, for days present in both.
# total_blocks is only computed for the global row in daily_metrics.
LEGACY_PARITY_SQL = text("""
WITH days AS (
  SELECT DISTINCT period_start AS day
  FROM daily_metrics
  WHERE period_start >= :from AND period_start < :to
  INTERSECT
  SELECT DISTINCT day
  FROM daily_stats
  WHERE day >= :from AND day < :to
)
SELECT
  COALESCE(m.period_start, s.day) AS day,
  COALESCE(m.category, s.category)::text AS category,
  COALESCE(m.rollup, s.rollup)::text AS rollup,
  m.total_transactions AS new_total_transactions,
  s.total_transactions AS legacy_total_transactions,
  m.total_blobs AS new_total_blobs,
  s.total_blobs AS legacy_total_blobs,
  m.total_blocks AS new_total_blocks,
  s.total_blocks AS legacy_total_blocks
FROM (SELECT * FROM daily_metrics WHERE period_start IN (SELECT day FROM days)) m
FULL OUTER JOIN (SELECT * FROM daily_stats WHERE day IN (SELECT day FROM days)) s
  ON s.day = m.period_start
  AND s.category IS NOT DISTINCT FROM m.category
  AND s.rollup IS NOT DISTINCT FROM m.rollup
WHERE COALESCE(m.total_transactions, 0) <> COALESCE(s.total_transactions, 0)
  OR COALESCE(m.total_blobs, 0) <> COALESCE(s.total_blobs, 0)
  OR (
    m.category IS NULL AND m.rollup IS NULL
    AND COALESCE(m.total_blocks, 0) <> COALESCE(s.total_blocks, 0)
  )
ORDER BY 1, 2, 3
""")


def find_legacy_mismatches(conn: Connection, start: date, end: date) -> list[dict]:
    """Return rows that differ between daily_metrics and daily_stats in [start, end)."""
    rows = conn.execute(LEGACY_PARITY_SQL, {"from": start, "to": end}).mappings()
    return [dict(row) for row in rows]


@dg.asset_check(
    asset=daily_metrics,
    name="matches_legacy_daily_stats",
    description=(
        "Compares transaction, blob and block counts with the legacy "
        "daily_stats table for the last completed days. Used to validate the "
        "Dagster pipeline before migrating the API off daily_stats."
    ),
)
def matches_legacy_daily_stats(postgres: PostgresResource) -> dg.AssetCheckResult:
    end = datetime.now(UTC).date()
    start = end - timedelta(days=LEGACY_PARITY_DAYS)

    with postgres.get_connection() as conn:
        mismatches = find_legacy_mismatches(conn, start, end)

    return dg.AssetCheckResult(
        passed=not mismatches,
        severity=dg.AssetCheckSeverity.WARN,
        metadata={
            "days_compared_from": str(start),
            "days_compared_to": str(end),
            "mismatches": dg.MetadataValue.int(len(mismatches)),
            # Keep metadata small: first rows are enough to investigate
            "sample": dg.MetadataValue.json(
                [{k: str(v) for k, v in row.items()} for row in mismatches[:20]],
            ),
        },
    )
