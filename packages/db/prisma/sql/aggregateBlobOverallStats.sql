-- @param {Int} $1:from The block number from which to start aggregating the data.
-- @param {Int} $2:to The block number until which to aggregate the data.
INSERT INTO overall_stats as curr_stats (
  category,
  rollup,
  total_blobs,
  total_unique_blobs,
  total_blob_size,
  updated_at
)
SELECT
  tx.category,
  tx.rollup,
  COALESCE(COUNT(bl_txs.blob_hash)::INT, 0) AS total_blobs,
  COALESCE(
    COUNT(DISTINCT CASE WHEN bl.first_block_number = bl_txs.block_number THEN bl.versioned_hash END)::INT,
    0
  ) AS total_unique_blobs,
  COALESCE(SUM(bl.size), 0) AS total_blob_size,
  NOW() AS updated_at
FROM blob bl
  JOIN blobs_on_transactions bl_txs ON bl_txs.blob_hash = bl.versioned_hash
  JOIN transaction tx ON tx.hash = bl_txs.tx_hash
  LEFT JOIN transaction_fork tx_f ON tx_f.block_hash = tx.block_hash AND tx_f.hash = tx.hash
WHERE tx_f.hash IS NULL AND tx.block_number BETWEEN $1 AND $2
GROUP BY GROUPING SETS (
  (tx.category),
  (tx.rollup),
  ()
)
--  Exclude NULL rollup aggregates from the second grouping set, as they’re already included in the first when the category is OTHER
HAVING NOT (
  GROUPING(tx.rollup) = 0 AND
  tx.rollup IS NULL
)
ON CONFLICT (category, rollup) DO UPDATE SET
  total_blobs = curr_stats.total_blobs + EXCLUDED.total_blobs,
  total_unique_blobs = curr_stats.total_unique_blobs + EXCLUDED.total_unique_blobs,
  total_blob_size = curr_stats.total_blob_size + EXCLUDED.total_blob_size,
  updated_at = EXCLUDED.updated_at