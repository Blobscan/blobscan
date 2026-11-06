-- All-time metrics of each address, from the closed days of
-- address_daily_metrics. The current day is not included: the API adds the
-- daily rows after aggregated_until. The session time zone is UTC (see
-- resources/postgres.py), so CURRENT_DATE is the current UTC day.
INSERT INTO address_all_time_metrics (
  address,
  aggregated_until,

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

  updated_at
)
SELECT
  address,
  CURRENT_DATE - 1 AS aggregated_until,

  SUM(sent_total_transactions)::INT AS sent_total_transactions,
  SUM(sent_total_blobs)::INT AS sent_total_blobs,
  SUM(sent_total_blob_usage_size) AS sent_total_blob_usage_size,
  SUM(sent_total_blob_base_fee) AS sent_total_blob_base_fee,
  SUM(sent_total_blob_as_calldata_fee) AS sent_total_blob_as_calldata_fee,
  -- SUM skips NULL, so the USD total stays NULL when no day has a price.
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

  now() AS updated_at
FROM address_daily_metrics
WHERE period_start < CURRENT_DATE
GROUP BY address
