INSERT INTO {{target_table}} (
  period_start,
  category,
  rollup,

  -- ------------- GLOBAL-ONLY METRICS -------------
  total_blob_gas_price,
  total_blocks,
  total_eth_price,
  total_eth_price_samples,
  max_eth_price,
  min_eth_price,

  -- ------------- DIMENSIONAL METRICS -------------
  total_transactions,
  total_unique_receivers,
  total_unique_senders,
  total_blob_gas_used,
  total_blob_as_calldata_gas_used,
  total_blob_base_fee,
  total_blob_max_fee,
  total_blob_as_calldata_fee,
  total_blob_as_calldata_max_fee,
  total_max_blob_gas_fee,
  total_blobs,
  total_unique_blobs,
  total_blob_size,
  total_blob_usage_size
)
SELECT
  DATE_TRUNC('{{trunc}}', period_start) AS period_start,
  category,
  rollup,

  -- ------------- GLOBAL-ONLY METRICS -------------
  SUM(total_blob_gas_price) AS total_blob_gas_price,
  SUM(total_blocks) AS total_blocks,
  SUM(total_eth_price) AS total_eth_price,
  SUM(total_eth_price_samples) AS total_eth_price_samples,
  MAX(max_eth_price) AS max_eth_price,
  MIN(min_eth_price) AS min_eth_price,

  -- ------------- DIMENSIONAL METRICS -------------

  SUM(total_transactions) AS total_transactions,
  SUM(total_unique_receivers) AS total_unique_receivers,
  SUM(total_unique_senders) AS total_unique_senders,
  SUM(total_blob_gas_used) AS total_blob_gas_used,
  SUM(total_blob_as_calldata_gas_used) AS total_blob_as_calldata_gas_used,
  SUM(total_blob_base_fee) AS total_blob_base_fee,
  SUM(total_blob_max_fee) AS total_blob_max_fee,
  SUM(total_blob_as_calldata_fee) AS total_blob_as_calldata_fee,
  SUM(total_blob_as_calldata_max_fee) AS total_blob_as_calldata_max_fee,
  SUM(total_max_blob_gas_fee) AS total_max_blob_gas_fee,
  SUM(total_blobs) AS total_blobs,
  SUM(total_unique_blobs) AS total_unique_blobs,
  SUM(total_blob_size) AS total_blob_size,
  SUM(total_blob_usage_size) AS total_blob_usage_size
FROM {{source_table}}
WHERE period_start >= :from AND period_start < :to
GROUP BY DATE_TRUNC('{{trunc}}', period_start), category, rollup
ON CONFLICT (period_start, category, rollup) DO UPDATE SET
  total_blob_gas_price = EXCLUDED.total_blob_gas_price,
  total_blocks = EXCLUDED.total_blocks,
  total_eth_price = EXCLUDED.total_eth_price,
  total_eth_price_samples = EXCLUDED.total_eth_price_samples,
  max_eth_price = EXCLUDED.max_eth_price,
  min_eth_price = EXCLUDED.min_eth_price,

  total_transactions = EXCLUDED.total_transactions,
  total_unique_receivers = EXCLUDED.total_unique_receivers,
  total_unique_senders = EXCLUDED.total_unique_senders,
  total_blob_gas_used = EXCLUDED.total_blob_gas_used,
  total_blob_as_calldata_gas_used = EXCLUDED.total_blob_as_calldata_gas_used,
  total_blob_base_fee = EXCLUDED.total_blob_base_fee,
  total_blob_max_fee = EXCLUDED.total_blob_max_fee,
  total_blob_as_calldata_fee = EXCLUDED.total_blob_as_calldata_fee,
  total_blob_as_calldata_max_fee = EXCLUDED.total_blob_as_calldata_max_fee,
  total_max_blob_gas_fee = EXCLUDED.total_max_blob_gas_fee,
  total_blobs = EXCLUDED.total_blobs,
  total_unique_blobs = EXCLUDED.total_unique_blobs,
  total_blob_size = EXCLUDED.total_blob_size,
  total_blob_usage_size = EXCLUDED.total_blob_usage_size
