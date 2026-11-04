INSERT INTO {{target_table}} (
  period_start,
  category,
  rollup,

  -- ------------- GLOBAL-ONLY METRICS -------------
  total_blob_gas_price,
  total_blocks,
  max_blob_gas_price,
  min_blob_gas_price,
  total_eth_price,
  total_eth_price_count,
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
  total_blob_usage_size,
  total_blob_base_fee_usd,
  total_blob_as_calldata_fee_usd,
  total_blob_max_fee_usd,
  total_usd_priced_transactions,

  -- ------------- BLOCK RANGE -------------
  first_block_number,
  last_block_number,
  first_slot,
  last_slot,
  first_epoch,
  last_epoch,
  first_block_timestamp,
  last_block_timestamp,

  updated_at
)
SELECT
  DATE_TRUNC('{{trunc}}', period_start) AS period_start,
  category,
  rollup,

  -- ------------- GLOBAL-ONLY METRICS -------------
  SUM(total_blob_gas_price) AS total_blob_gas_price,
  SUM(total_blocks) AS total_blocks,
  MAX(max_blob_gas_price) AS max_blob_gas_price,
  MIN(min_blob_gas_price) AS min_blob_gas_price,
  SUM(total_eth_price) AS total_eth_price,
  SUM(total_eth_price_count) AS total_eth_price_count,
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
  SUM(total_blob_usage_size) AS total_blob_usage_size,
  SUM(total_blob_base_fee_usd) AS total_blob_base_fee_usd,
  SUM(total_blob_as_calldata_fee_usd) AS total_blob_as_calldata_fee_usd,
  SUM(total_blob_max_fee_usd) AS total_blob_max_fee_usd,
  SUM(total_usd_priced_transactions) AS total_usd_priced_transactions,

  -- ------------- BLOCK RANGE -------------
  MIN(first_block_number) AS first_block_number,
  MAX(last_block_number) AS last_block_number,
  MIN(first_slot) AS first_slot,
  MAX(last_slot) AS last_slot,
  MIN(first_epoch) AS first_epoch,
  MAX(last_epoch) AS last_epoch,
  MIN(first_block_timestamp) AS first_block_timestamp,
  MAX(last_block_timestamp) AS last_block_timestamp,

  now()
FROM {{source_table}}
WHERE period_start >= :from AND period_start < :to
GROUP BY DATE_TRUNC('{{trunc}}', period_start), category, rollup
ON CONFLICT (period_start, category, rollup) DO UPDATE SET
  total_blob_gas_price = EXCLUDED.total_blob_gas_price,
  total_blocks = EXCLUDED.total_blocks,
  max_blob_gas_price = EXCLUDED.max_blob_gas_price,
  min_blob_gas_price = EXCLUDED.min_blob_gas_price,
  total_eth_price = EXCLUDED.total_eth_price,
  total_eth_price_count = EXCLUDED.total_eth_price_count,
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
  total_blob_usage_size = EXCLUDED.total_blob_usage_size,
  total_blob_base_fee_usd = EXCLUDED.total_blob_base_fee_usd,
  total_blob_as_calldata_fee_usd = EXCLUDED.total_blob_as_calldata_fee_usd,
  total_blob_max_fee_usd = EXCLUDED.total_blob_max_fee_usd,
  total_usd_priced_transactions = EXCLUDED.total_usd_priced_transactions,

  first_block_number = EXCLUDED.first_block_number,
  last_block_number = EXCLUDED.last_block_number,
  first_slot = EXCLUDED.first_slot,
  last_slot = EXCLUDED.last_slot,
  first_epoch = EXCLUDED.first_epoch,
  last_epoch = EXCLUDED.last_epoch,
  first_block_timestamp = EXCLUDED.first_block_timestamp,
  last_block_timestamp = EXCLUDED.last_block_timestamp,

  updated_at = now()
