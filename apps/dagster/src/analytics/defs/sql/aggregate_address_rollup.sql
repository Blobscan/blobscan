-- Metrics of each address for the [:from, :to) window, one row for each
-- address and {{trunc}}, from the rows of {{source_table}}. The weekly and
-- the monthly assets read address_daily_metrics, and the yearly asset reads
-- address_monthly_metrics, as the network metrics do (see aggregate.sql).
--
-- All the metrics are sums, except the first and the last block timestamps,
-- so a level has the same values as the transactions of its period.
INSERT INTO {{target_table}} (
  period_start,
  address,

  sent_total_transactions,
  sent_total_blobs,
  sent_total_blob_usage_size,
  sent_total_blob_base_fee,
  sent_total_blob_as_calldata_fee,
  sent_total_blob_base_fee_usd,
  sent_total_blob_as_calldata_fee_usd,
  sent_total_usd_priced_transactions,
  sent_first_block_timestamp,
  sent_last_block_timestamp,

  received_total_transactions,
  received_total_blobs,
  received_total_blob_usage_size,
  received_total_blob_base_fee,
  received_total_blob_as_calldata_fee,
  received_total_blob_base_fee_usd,
  received_total_blob_as_calldata_fee_usd,
  received_total_usd_priced_transactions,
  received_first_block_timestamp,
  received_last_block_timestamp,

  self_total_transactions,
  self_total_blobs,

  updated_at
)
SELECT
  DATE_TRUNC('{{trunc}}', period_start)::DATE AS period_start,
  address,

  SUM(sent_total_transactions)::INT AS sent_total_transactions,
  SUM(sent_total_blobs)::INT AS sent_total_blobs,
  SUM(sent_total_blob_usage_size) AS sent_total_blob_usage_size,
  SUM(sent_total_blob_base_fee) AS sent_total_blob_base_fee,
  SUM(sent_total_blob_as_calldata_fee) AS sent_total_blob_as_calldata_fee,
  -- SUM skips NULL, so the USD total stays NULL when no row has a price.
  SUM(sent_total_blob_base_fee_usd) AS sent_total_blob_base_fee_usd,
  SUM(sent_total_blob_as_calldata_fee_usd) AS sent_total_blob_as_calldata_fee_usd,
  SUM(sent_total_usd_priced_transactions)::INT AS sent_total_usd_priced_transactions,
  MIN(sent_first_block_timestamp) AS sent_first_block_timestamp,
  MAX(sent_last_block_timestamp) AS sent_last_block_timestamp,

  SUM(received_total_transactions)::INT AS received_total_transactions,
  SUM(received_total_blobs)::INT AS received_total_blobs,
  SUM(received_total_blob_usage_size) AS received_total_blob_usage_size,
  SUM(received_total_blob_base_fee) AS received_total_blob_base_fee,
  SUM(received_total_blob_as_calldata_fee) AS received_total_blob_as_calldata_fee,
  SUM(received_total_blob_base_fee_usd) AS received_total_blob_base_fee_usd,
  SUM(received_total_blob_as_calldata_fee_usd) AS received_total_blob_as_calldata_fee_usd,
  SUM(received_total_usd_priced_transactions)::INT AS received_total_usd_priced_transactions,
  MIN(received_first_block_timestamp) AS received_first_block_timestamp,
  MAX(received_last_block_timestamp) AS received_last_block_timestamp,

  SUM(self_total_transactions)::INT AS self_total_transactions,
  SUM(self_total_blobs)::INT AS self_total_blobs,

  now() AS updated_at
FROM {{source_table}}
WHERE period_start >= :from AND period_start < :to
GROUP BY DATE_TRUNC('{{trunc}}', period_start), address
ON CONFLICT (address, period_start) DO UPDATE SET
  sent_total_transactions = EXCLUDED.sent_total_transactions,
  sent_total_blobs = EXCLUDED.sent_total_blobs,
  sent_total_blob_usage_size = EXCLUDED.sent_total_blob_usage_size,
  sent_total_blob_base_fee = EXCLUDED.sent_total_blob_base_fee,
  sent_total_blob_as_calldata_fee = EXCLUDED.sent_total_blob_as_calldata_fee,
  sent_total_blob_base_fee_usd = EXCLUDED.sent_total_blob_base_fee_usd,
  sent_total_blob_as_calldata_fee_usd = EXCLUDED.sent_total_blob_as_calldata_fee_usd,
  sent_total_usd_priced_transactions = EXCLUDED.sent_total_usd_priced_transactions,
  sent_first_block_timestamp = EXCLUDED.sent_first_block_timestamp,
  sent_last_block_timestamp = EXCLUDED.sent_last_block_timestamp,

  received_total_transactions = EXCLUDED.received_total_transactions,
  received_total_blobs = EXCLUDED.received_total_blobs,
  received_total_blob_usage_size = EXCLUDED.received_total_blob_usage_size,
  received_total_blob_base_fee = EXCLUDED.received_total_blob_base_fee,
  received_total_blob_as_calldata_fee = EXCLUDED.received_total_blob_as_calldata_fee,
  received_total_blob_base_fee_usd = EXCLUDED.received_total_blob_base_fee_usd,
  received_total_blob_as_calldata_fee_usd = EXCLUDED.received_total_blob_as_calldata_fee_usd,
  received_total_usd_priced_transactions = EXCLUDED.received_total_usd_priced_transactions,
  received_first_block_timestamp = EXCLUDED.received_first_block_timestamp,
  received_last_block_timestamp = EXCLUDED.received_last_block_timestamp,

  self_total_transactions = EXCLUDED.self_total_transactions,
  self_total_blobs = EXCLUDED.self_total_blobs,

  updated_at = now()
