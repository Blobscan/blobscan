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
  DATE_TRUNC('hour', bck.timestamp) AS period_start,
  CASE WHEN f.rollup IS NOT NULL THEN 'rollup'::category ELSE 'other'::category END AS category,
  f.rollup,

  COALESCE(AVG(b.usage_size)::FLOAT, 0) AS avg_blob_usage_size,

  COALESCE(COUNT(bl_tx.blob_hash)::INT, 0) AS total_blobs,
  COUNT(
    DISTINCT CASE
      WHEN b.first_block_number = bl_tx.block_number THEN bl_tx.blob_hash
    END
  ) AS total_unique_blobs,
  COALESCE(SUM(b.size), 0) AS total_blob_size,
  COALESCE(SUM(b.usage_size), 0) AS total_blob_usage_size
FROM blob b
  JOIN blobs_on_transactions bl_tx ON bl_tx.blob_hash = b.versioned_hash
  JOIN transaction tx ON tx.hash = bl_tx.tx_hash
  JOIN address f ON f.address = tx.from_id
  JOIN block bck ON bck.hash = tx.block_hash
  LEFT JOIN transaction_fork tx_f ON tx_f.block_hash = bck.hash AND tx_f.hash = tx.hash
WHERE tx_f.hash IS NULL AND bck.timestamp BETWEEN :from AND :to
GROUP BY GROUPING SETS (
  (period_start, category),
  (period_start, f.rollup),
  (period_start)
)
-- Exclude NULL rollup aggregates from the second grouping set,
-- as they're already included in the first when the category is OTHER
HAVING NOT (
  GROUPING(f.rollup) = 0 AND
  f.rollup IS NULL
)
ON CONFLICT (period_start, category, rollup) DO UPDATE SET
  avg_blob_usage_size = EXCLUDED.avg_blob_usage_size,

  total_blobs = EXCLUDED.total_blobs,
  total_unique_blobs = EXCLUDED.total_unique_blobs,
  total_blob_size = EXCLUDED.total_blob_size,
  total_blob_usage_size = EXCLUDED.total_blob_usage_size
