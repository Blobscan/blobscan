-- @param {Int} $1:from The block number from which to start aggregating the data.
-- @param {Int} $2:to The block number until which to aggregate the data.
INSERT INTO block_overall_stats AS curr_stats (
  id,
  total_blocks,
  total_blob_gas_used,
  total_blob_as_calldata_gas_used,
  total_blob_fee,
  total_blob_as_calldata_fee,
  total_blob_gas_price,
  avg_blob_fee,
  avg_blob_as_calldata_fee,
  avg_blob_gas_price,
  updated_at
)
SELECT
  1 AS id,
  COALESCE(COUNT(b.hash)::INT, 0) AS total_blocks,
  COALESCE(SUM(b.blob_gas_used)::DECIMAL(50,0), 0) AS total_blob_gas_used,
  COALESCE(SUM(b.blob_as_calldata_gas_used)::DECIMAL(50,0), 0) AS total_blob_as_calldata_gas_used,
  COALESCE(SUM(b.blob_gas_used * b.blob_gas_price)::DECIMAL(50,0), 0) AS total_blob_fee,
  COALESCE(SUM(b.blob_as_calldata_gas_used * b.blob_gas_price)::DECIMAL(50,0), 0) AS total_blob_as_calldata_fee,
  COALESCE(SUM(b.blob_gas_price)::DECIMAL(50,0), 0) AS total_blob_gas_price,
  COALESCE(AVG(b.blob_gas_used * b.blob_gas_price)::FLOAT, 0) AS avg_blob_fee,
  COALESCE(AVG(b.blob_as_calldata_gas_used * b.blob_gas_price)::FLOAT, 0) AS avg_blob_as_calldata_fee,
  COALESCE(AVG(b.blob_gas_price)::FLOAT, 0) AS avg_blob_gas_price,
  NOW() AS updated_at
FROM block b
  LEFT JOIN transaction_fork tx_f ON tx_f.block_hash = b.hash
WHERE tx_f.block_hash IS NULL AND b.number BETWEEN $1 AND $2
ON CONFLICT (id) DO UPDATE SET
  total_blocks = curr_stats.total_blocks + EXCLUDED.total_blocks,
  total_blob_gas_used = curr_stats.total_blob_gas_used + EXCLUDED.total_blob_gas_used,
  total_blob_as_calldata_gas_used = curr_stats.total_blob_as_calldata_gas_used + EXCLUDED.total_blob_as_calldata_gas_used,
  total_blob_fee = curr_stats.total_blob_fee + EXCLUDED.total_blob_fee,
  total_blob_as_calldata_fee = curr_stats.total_blob_as_calldata_fee + EXCLUDED.total_blob_as_calldata_fee,
  total_blob_gas_price = curr_stats.total_blob_gas_price + EXCLUDED.total_blob_gas_price,
  avg_blob_fee = 
    CASE
      WHEN curr_stats.total_blocks + EXCLUDED.total_blocks = 0 THEN EXCLUDED.avg_blob_fee
      ELSE (curr_stats.total_blob_fee + EXCLUDED.total_blob_fee) / (curr_stats.total_blocks + EXCLUDED.total_blocks)
    END,
  avg_blob_as_calldata_fee =
    CASE
      WHEN curr_stats.total_blocks + EXCLUDED.total_blocks = 0 THEN EXCLUDED.avg_blob_as_calldata_fee
      ELSE (curr_stats.total_blob_as_calldata_fee + EXCLUDED.total_blob_as_calldata_fee) / (curr_stats.total_blocks + EXCLUDED.total_blocks)
    END,
  avg_blob_gas_price = 
    CASE
      WHEN curr_stats.total_blocks + EXCLUDED.total_blocks = 0 THEN EXCLUDED.avg_blob_gas_price
      ELSE (curr_stats.total_blob_gas_price + EXCLUDED.total_blob_gas_price) / (curr_stats.total_blocks + EXCLUDED.total_blocks)
    END,
  updated_at = EXCLUDED.updated_at