WITH base AS (
  SELECT
    DATE_TRUNC('hour', bck.timestamp) AS period_start,
    CASE WHEN f.rollup IS NOT NULL THEN 'rollup'::category ELSE 'other'::category END AS category,
    f.rollup,
    bl_tx.blob_hash,
    bl_tx.block_number,
    b.first_block_number,
    b.size,
    b.usage_size
  FROM blob b
    JOIN blobs_on_transactions bl_tx ON bl_tx.blob_hash = b.versioned_hash
    JOIN transaction tx ON tx.hash = bl_tx.tx_hash
    JOIN address f ON f.address = tx.from_id
    JOIN block bck ON bck.hash = tx.block_hash
  WHERE bck.timestamp >= :from AND bck.timestamp < :to
    AND NOT EXISTS (
      SELECT 1 FROM transaction_fork tx_f
      WHERE tx_f.block_hash = bck.hash AND tx_f.hash = tx.hash
    )
)
INSERT INTO hourly_metrics (
  period_start,
  category,
  rollup,

  avg_blob_usage_size,

  total_blobs,
  total_unique_blobs,
  total_blob_size,
  total_blob_usage_size
)
SELECT
  period_start,
  category,
  rollup,

  COALESCE(AVG(usage_size)::FLOAT, 0) AS avg_blob_usage_size,

  COUNT(blob_hash)::INT AS total_blobs,
  COUNT(
    DISTINCT CASE
      WHEN first_block_number = block_number THEN blob_hash
    END
  ) AS total_unique_blobs,
  COALESCE(SUM(size), 0) AS total_blob_size,
  COALESCE(SUM(usage_size), 0) AS total_blob_usage_size
FROM base
GROUP BY GROUPING SETS (
  (period_start, category),
  (period_start, rollup),
  (period_start)
)
HAVING NOT (
  GROUPING(rollup) = 0 AND
  rollup IS NULL
)
ON CONFLICT (period_start, category, rollup) DO UPDATE SET
  avg_blob_usage_size = EXCLUDED.avg_blob_usage_size,

  total_blobs = EXCLUDED.total_blobs,
  total_unique_blobs = EXCLUDED.total_unique_blobs,
  total_blob_size = EXCLUDED.total_blob_size,
  total_blob_usage_size = EXCLUDED.total_blob_usage_size
