INSERT INTO {{target_table}} (
  period_start,
  category,
  rollup,

  -- ------------- GLOBAL-ONLY METRICS -------------
  avg_blob_gas_price,

  total_blob_gas_price,
  total_blocks,

  -- ------------- DIMENSIONAL METRICS -------------
  avg_blob_base_fee,
  avg_blob_max_fee,
  avg_blob_as_calldata_fee,
  avg_blob_as_calldata_max_fee,
  avg_max_blob_gas_fee,
  avg_blob_usage_size,

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
  -- Weighted averages using total / count (NULL for non-global rows)
  (SUM(total_blob_gas_price) / NULLIF(SUM(total_blocks), 0))::FLOAT AS avg_blob_gas_price,

  SUM(total_blob_gas_price) AS total_blob_gas_price,
  SUM(total_blocks) AS total_blocks,

  -- ------------- DIMENSIONAL METRICS -------------
  (SUM(total_blob_base_fee) / NULLIF(SUM(total_transactions), 0))::FLOAT AS avg_blob_base_fee,
  (SUM(total_blob_max_fee) / NULLIF(SUM(total_transactions), 0))::FLOAT AS avg_blob_max_fee,
  (SUM(total_blob_as_calldata_fee) / NULLIF(SUM(total_transactions), 0))::FLOAT AS avg_blob_as_calldata_fee,
  (SUM(total_blob_as_calldata_max_fee) / NULLIF(SUM(total_transactions), 0))::FLOAT AS avg_blob_as_calldata_max_fee,
  (SUM(total_max_blob_gas_fee) / NULLIF(SUM(total_transactions), 0))::FLOAT AS avg_max_blob_gas_fee,
  (SUM(total_blob_usage_size) / NULLIF(SUM(total_blobs), 0))::FLOAT AS avg_blob_usage_size,

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
  avg_blob_gas_price = EXCLUDED.avg_blob_gas_price,

  total_blob_gas_price = EXCLUDED.total_blob_gas_price,
  total_blocks = EXCLUDED.total_blocks,

  avg_blob_base_fee = EXCLUDED.avg_blob_base_fee,
  avg_blob_max_fee = EXCLUDED.avg_blob_max_fee,
  avg_blob_as_calldata_fee = EXCLUDED.avg_blob_as_calldata_fee,
  avg_blob_as_calldata_max_fee = EXCLUDED.avg_blob_as_calldata_max_fee,
  avg_max_blob_gas_fee = EXCLUDED.avg_max_blob_gas_fee,
  avg_blob_usage_size = EXCLUDED.avg_blob_usage_size,

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
