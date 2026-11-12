-- Compare the global hourly_metrics rows with the source tables, for each
-- hour of the [from, to) window. Return only the hours that differ.
--
-- The counts use the same filters as the hourly aggregation: forked
-- transactions are excluded, and the hour comes from the block timestamp. They
-- do not join the address, block and blob tables, so a row that the
-- aggregation drops because one of these joins finds nothing is reported too.
WITH source_tx AS (
  SELECT
    DATE_TRUNC('hour', tx.block_timestamp) AS period_start,
    COUNT(*) AS total_transactions,
    COUNT(DISTINCT tx.block_number) AS total_blocks
  FROM transaction tx
  WHERE tx.block_timestamp >= :from AND tx.block_timestamp < :to
    AND NOT EXISTS (
      SELECT 1 FROM transaction_fork tx_f
      WHERE tx_f.block_hash = tx.block_hash AND tx_f.hash = tx.hash
    )
  GROUP BY DATE_TRUNC('hour', tx.block_timestamp)
),
source_blob AS (
  SELECT
    DATE_TRUNC('hour', bl_tx.block_timestamp) AS period_start,
    COUNT(*) AS total_blobs
  FROM blobs_on_transactions bl_tx
  WHERE bl_tx.block_timestamp >= :from AND bl_tx.block_timestamp < :to
    AND NOT EXISTS (
      SELECT 1 FROM transaction_fork tx_f
      WHERE tx_f.block_hash = bl_tx.block_hash AND tx_f.hash = bl_tx.tx_hash
    )
  GROUP BY DATE_TRUNC('hour', bl_tx.block_timestamp)
),
source AS (
  SELECT
    period_start,
    COALESCE(source_tx.total_transactions, 0) AS total_transactions,
    COALESCE(source_tx.total_blocks, 0) AS total_blocks,
    COALESCE(source_blob.total_blobs, 0) AS total_blobs
  FROM source_tx
  FULL JOIN source_blob USING (period_start)
),
metrics AS (
  -- An hour with only ETH prices has a global row with no transactions
  SELECT
    period_start,
    COALESCE(total_transactions, 0) AS total_transactions,
    COALESCE(total_blocks, 0) AS total_blocks,
    COALESCE(total_blobs, 0) AS total_blobs
  FROM hourly_metrics
  WHERE category IS NULL AND rollup IS NULL
    AND period_start >= :from AND period_start < :to
)
SELECT
  period_start,
  COALESCE(m.total_transactions, 0) AS metrics_transactions,
  COALESCE(s.total_transactions, 0) AS source_transactions,
  COALESCE(m.total_blocks, 0) AS metrics_blocks,
  COALESCE(s.total_blocks, 0) AS source_blocks,
  COALESCE(m.total_blobs, 0) AS metrics_blobs,
  COALESCE(s.total_blobs, 0) AS source_blobs
FROM metrics m
FULL JOIN source s USING (period_start)
WHERE COALESCE(m.total_transactions, 0) <> COALESCE(s.total_transactions, 0)
  OR COALESCE(m.total_blocks, 0) <> COALESCE(s.total_blocks, 0)
  OR COALESCE(m.total_blobs, 0) <> COALESCE(s.total_blobs, 0)
ORDER BY period_start
