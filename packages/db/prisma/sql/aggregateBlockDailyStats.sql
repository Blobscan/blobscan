-- @param {DateTime} $1:from The date from which to start aggregating the data.
-- @param {DateTime} $2:to The date until which to aggregate the data.
INSERT INTO block_daily_stats (
  day,
  total_blocks,
  total_blob_gas_used,
  total_blob_as_calldata_gas_used,
  total_blob_fee,
  total_blob_as_calldata_fee,
  avg_blob_fee,
  avg_blob_as_calldata_fee,
  avg_blob_gas_price
)
SELECT
  DATE_TRUNC('day', b.timestamp) AS day,
  COUNT(b.hash)::INT AS total_blocks,
  SUM(b.blob_gas_used)::DECIMAL AS total_blob_gas_used,
  SUM(b.blob_as_calldata_gas_used)::DECIMAL AS total_blob_as_calldata_gas_used,
  SUM(b.blob_gas_used * b.blob_gas_price)::DECIMAL AS total_blob_fee,
  SUM(b.blob_as_calldata_gas_used * b.blob_gas_price)::DECIMAL as total_blob_as_calldata_fee,
  AVG(b.blob_gas_used * b.blob_gas_price)::FLOAT AS avg_blob_fee,
  AVG(b.blob_as_calldata_gas_used * b.blob_gas_price)::FLOAT AS avg_blob_as_calldata_fee,
  AVG(b.blob_gas_price)::FLOAT AS avg_blob_gas_price
FROM block b
LEFT JOIN transaction_fork tx_f ON tx_f.block_hash = b.hash
WHERE tx_f.block_hash IS NULL AND b.timestamp BETWEEN $1 AND $2
GROUP BY day
ON CONFLICT (day) DO UPDATE SET
  total_blocks = EXCLUDED.total_blocks,
  total_blob_gas_used = EXCLUDED.total_blob_gas_used,
  total_blob_as_calldata_gas_used = EXCLUDED.total_blob_as_calldata_gas_used,
  total_blob_fee = EXCLUDED.total_blob_fee,
  total_blob_as_calldata_fee = EXCLUDED.total_blob_as_calldata_fee,
  avg_blob_fee = EXCLUDED.avg_blob_fee,
  avg_blob_as_calldata_fee = EXCLUDED.avg_blob_as_calldata_fee,
  avg_blob_gas_price = EXCLUDED.avg_blob_gas_price