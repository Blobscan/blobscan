-- All-time metrics of each address, from the closed periods: the closed
-- years (address_yearly_metrics), the closed months of the current year
-- (address_monthly_metrics) and the closed days of the current month
-- (address_daily_metrics). The network all-time metrics use the same levels
-- (see aggregate_all_time.sql). The current day is not included: the API
-- adds the daily rows after aggregated_until. The session time zone is UTC
-- (see resources/postgres.py), so CURRENT_DATE is the current UTC day.
WITH cutoffs AS (
  SELECT
    DATE_TRUNC('year', CURRENT_DATE)::DATE AS cur_year,
    DATE_TRUNC('month', CURRENT_DATE)::DATE AS cur_month
),

closed_periods AS (
  -- List the columns by name. UNION ALL matches the columns by position.
  -- The closed years.
  SELECT
    y.address,
    y.sent_total_transactions,
    y.sent_total_blobs,
    y.sent_total_blob_usage_size,
    y.sent_total_blob_base_fee,
    y.sent_total_blob_as_calldata_fee,
    y.sent_total_blob_base_fee_usd,
    y.sent_total_blob_as_calldata_fee_usd,
    y.sent_total_usd_priced_transactions,
    y.sent_first_block_timestamp,
    y.sent_last_block_timestamp,
    y.received_total_transactions,
    y.received_total_blobs,
    y.received_total_blob_usage_size,
    y.received_total_blob_base_fee,
    y.received_total_blob_as_calldata_fee,
    y.received_total_blob_base_fee_usd,
    y.received_total_blob_as_calldata_fee_usd,
    y.received_total_usd_priced_transactions,
    y.received_first_block_timestamp,
    y.received_last_block_timestamp,
    y.self_total_transactions,
    y.self_total_blobs
  FROM address_yearly_metrics y
  CROSS JOIN cutoffs c
  WHERE y.period_start < c.cur_year

  UNION ALL

  -- The closed months of the current year.
  SELECT
    m.address,
    m.sent_total_transactions,
    m.sent_total_blobs,
    m.sent_total_blob_usage_size,
    m.sent_total_blob_base_fee,
    m.sent_total_blob_as_calldata_fee,
    m.sent_total_blob_base_fee_usd,
    m.sent_total_blob_as_calldata_fee_usd,
    m.sent_total_usd_priced_transactions,
    m.sent_first_block_timestamp,
    m.sent_last_block_timestamp,
    m.received_total_transactions,
    m.received_total_blobs,
    m.received_total_blob_usage_size,
    m.received_total_blob_base_fee,
    m.received_total_blob_as_calldata_fee,
    m.received_total_blob_base_fee_usd,
    m.received_total_blob_as_calldata_fee_usd,
    m.received_total_usd_priced_transactions,
    m.received_first_block_timestamp,
    m.received_last_block_timestamp,
    m.self_total_transactions,
    m.self_total_blobs
  FROM address_monthly_metrics m
  CROSS JOIN cutoffs c
  WHERE m.period_start >= c.cur_year AND m.period_start < c.cur_month

  UNION ALL

  -- The closed days of the current month.
  SELECT
    d.address,
    d.sent_total_transactions,
    d.sent_total_blobs,
    d.sent_total_blob_usage_size,
    d.sent_total_blob_base_fee,
    d.sent_total_blob_as_calldata_fee,
    d.sent_total_blob_base_fee_usd,
    d.sent_total_blob_as_calldata_fee_usd,
    d.sent_total_usd_priced_transactions,
    d.sent_first_block_timestamp,
    d.sent_last_block_timestamp,
    d.received_total_transactions,
    d.received_total_blobs,
    d.received_total_blob_usage_size,
    d.received_total_blob_base_fee,
    d.received_total_blob_as_calldata_fee,
    d.received_total_blob_base_fee_usd,
    d.received_total_blob_as_calldata_fee_usd,
    d.received_total_usd_priced_transactions,
    d.received_first_block_timestamp,
    d.received_last_block_timestamp,
    d.self_total_transactions,
    d.self_total_blobs
  FROM address_daily_metrics d
  CROSS JOIN cutoffs c
  WHERE d.period_start >= c.cur_month AND d.period_start < CURRENT_DATE
)
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
  self_total_blobs,

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
  -- SUM skips NULL, so the USD total stays NULL when no period has a price.
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
FROM closed_periods
GROUP BY address
