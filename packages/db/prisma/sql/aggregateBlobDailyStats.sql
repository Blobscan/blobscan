-- @param {DateTime} $1:from The date from which to start aggregating the data.
-- @param {DateTime} $2:to The date until which to aggregate the data.
INSERT INTO daily_stats (
  day,
  category,
  rollup,
  total_blobs,
  total_unique_blobs,
  total_blob_size
)
SELECT
  DATE_TRUNC('day', bck.timestamp) AS day,
  tx.category,
  tx.rollup,
  COUNT(bl_tx.blob_hash)::INT AS total_blobs,
  COUNT(
    DISTINCT CASE
      WHEN b.first_block_number = bl_tx.block_number THEN bl_tx.blob_hash
    END
  ) AS total_unique_blobs,
  SUM(b.size) AS total_blob_size
FROM blob b
  JOIN blobs_on_transactions bl_tx ON bl_tx.blob_hash = b.versioned_hash
  JOIN transaction tx ON tx.hash = bl_tx.tx_hash
  JOIN block bck ON bck.hash = tx.block_hash
  LEFT JOIN transaction_fork tx_f ON tx_f.block_hash = bck.hash AND tx_f.hash = tx.hash
WHERE tx_f.hash IS NULL AND bck.timestamp BETWEEN $1 AND $2
GROUP BY GROUPING SETS (
  (day, tx.category),
  (day, tx.rollup),
  (day)
)
--  Exclude NULL rollup aggregates from the second grouping set, as they’re already included in the first when the category is OTHER
HAVING NOT (
  GROUPING(tx.rollup) = 0 AND
  tx.rollup IS NULL
)
ON CONFLICT (day, category, rollup) DO UPDATE SET
  total_blobs = EXCLUDED.total_blobs,
  total_unique_blobs = EXCLUDED.total_unique_blobs,
  total_blob_size = EXCLUDED.total_blob_size