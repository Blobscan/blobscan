WITH cutoffs AS (
  SELECT
    date_trunc('year',  now()) AS cur_year,
    date_trunc('month', now()) AS cur_month,
    date_trunc('day',   now()) AS cur_day,
    date_trunc('hour',  now()) AS cur_hour
),

unioned AS (
  -- List the columns by name. UNION ALL matches columns by position, and the
  -- column order of the source tables can be different.
  -- YEARLY: all completed years
  SELECT
    y.category,
    y.rollup,
    y.total_blob_base_fee,
    y.total_blob_gas_price,
    y.total_blocks,
    y.total_blob_as_calldata_fee,
    y.total_blob_as_calldata_gas_used,
    y.total_blob_as_calldata_max_fee,
    y.total_blob_gas_used,
    y.total_blob_max_fee,
    y.total_blobs,
    y.total_blob_size,
    y.total_blob_usage_size,
    y.total_transactions,
    y.total_unique_blobs,
    y.total_unique_receivers,
    y.total_unique_senders,
    y.total_max_blob_gas_fee
  FROM yearly_metrics y
  CROSS JOIN cutoffs c
  WHERE y.period_start < c.cur_year

  UNION ALL

  -- MONTHLY: completed months within the current year (not covered by yearly)
  SELECT
    m.category,
    m.rollup,
    m.total_blob_base_fee,
    m.total_blob_gas_price,
    m.total_blocks,
    m.total_blob_as_calldata_fee,
    m.total_blob_as_calldata_gas_used,
    m.total_blob_as_calldata_max_fee,
    m.total_blob_gas_used,
    m.total_blob_max_fee,
    m.total_blobs,
    m.total_blob_size,
    m.total_blob_usage_size,
    m.total_transactions,
    m.total_unique_blobs,
    m.total_unique_receivers,
    m.total_unique_senders,
    m.total_max_blob_gas_fee
  FROM monthly_metrics m
  CROSS JOIN cutoffs c
  WHERE m.period_start >= c.cur_year
    AND m.period_start <  c.cur_month

  UNION ALL

  -- DAILY: completed days within the current month (not covered by monthly)
  SELECT
    d.category,
    d.rollup,
    d.total_blob_base_fee,
    d.total_blob_gas_price,
    d.total_blocks,
    d.total_blob_as_calldata_fee,
    d.total_blob_as_calldata_gas_used,
    d.total_blob_as_calldata_max_fee,
    d.total_blob_gas_used,
    d.total_blob_max_fee,
    d.total_blobs,
    d.total_blob_size,
    d.total_blob_usage_size,
    d.total_transactions,
    d.total_unique_blobs,
    d.total_unique_receivers,
    d.total_unique_senders,
    d.total_max_blob_gas_fee
  FROM daily_metrics d
  CROSS JOIN cutoffs c
  WHERE d.period_start >= c.cur_month
    AND d.period_start <  c.cur_day

  UNION ALL

  -- HOURLY: hours within the current day (not covered by daily)
  SELECT
    h.category,
    h.rollup,
    h.total_blob_base_fee,
    h.total_blob_gas_price,
    h.total_blocks,
    h.total_blob_as_calldata_fee,
    h.total_blob_as_calldata_gas_used,
    h.total_blob_as_calldata_max_fee,
    h.total_blob_gas_used,
    h.total_blob_max_fee,
    h.total_blobs,
    h.total_blob_size,
    h.total_blob_usage_size,
    h.total_transactions,
    h.total_unique_blobs,
    h.total_unique_receivers,
    h.total_unique_senders,
    h.total_max_blob_gas_fee
  FROM hourly_metrics h
  CROSS JOIN cutoffs c
  WHERE h.period_start >= c.cur_day
    AND h.period_start <= c.cur_hour
),

aggregated AS (
  SELECT
    u.category,
    u.rollup,

    SUM(u.total_blob_base_fee)              AS total_blob_base_fee,
    SUM(u.total_blob_gas_price)             AS total_blob_gas_price,
    SUM(u.total_blocks)                     AS total_blocks,

    SUM(u.total_blob_as_calldata_fee)       AS total_blob_as_calldata_fee,
    SUM(u.total_blob_as_calldata_gas_used)  AS total_blob_as_calldata_gas_used,
    SUM(u.total_blob_as_calldata_max_fee)   AS total_blob_as_calldata_max_fee,
    SUM(u.total_blob_gas_used)              AS total_blob_gas_used,
    SUM(u.total_blob_max_fee)               AS total_blob_max_fee,
    SUM(u.total_blobs)                      AS total_blobs,
    SUM(u.total_blob_size)                  AS total_blob_size,
    SUM(u.total_blob_usage_size)            AS total_blob_usage_size,
    SUM(u.total_transactions)               AS total_transactions,
    SUM(u.total_unique_blobs)               AS total_unique_blobs,
    SUM(u.total_unique_receivers)           AS total_unique_receivers,
    SUM(u.total_unique_senders)             AS total_unique_senders,
    SUM(u.total_max_blob_gas_fee)           AS total_max_blob_gas_fee
  FROM unioned u
  GROUP BY u.category, u.rollup
)

INSERT INTO all_time_metrics (
  category,
  rollup,

  total_blob_base_fee,
  total_blob_gas_price,
  total_blocks,

  total_blob_as_calldata_fee,
  total_blob_as_calldata_gas_used,
  total_blob_as_calldata_max_fee,
  total_blob_gas_used,
  total_blob_max_fee,
  total_blobs,
  total_blob_size,
  total_blob_usage_size,
  total_transactions,
  total_unique_blobs,
  total_unique_receivers,
  total_unique_senders,
  total_max_blob_gas_fee,
  updated_at
)
SELECT
  category, rollup,
  total_blob_base_fee,
  total_blob_gas_price,
  total_blocks,

  total_blob_as_calldata_fee,
  total_blob_as_calldata_gas_used,
  total_blob_as_calldata_max_fee,
  total_blob_gas_used,
  total_blob_max_fee,
  total_blobs, total_blob_size,
  total_blob_usage_size,
  total_transactions,
  total_unique_blobs,
  total_unique_receivers,
  total_unique_senders,
  total_max_blob_gas_fee,
  now()
FROM aggregated
ON CONFLICT (category, rollup)
DO UPDATE SET
  total_blob_base_fee = EXCLUDED.total_blob_base_fee,
  total_blob_gas_price = EXCLUDED.total_blob_gas_price,
  total_blocks = EXCLUDED.total_blocks,

  total_blob_as_calldata_fee = EXCLUDED.total_blob_as_calldata_fee,
  total_blob_as_calldata_gas_used = EXCLUDED.total_blob_as_calldata_gas_used,
  total_blob_as_calldata_max_fee = EXCLUDED.total_blob_as_calldata_max_fee,
  total_blob_gas_used = EXCLUDED.total_blob_gas_used,
  total_blob_max_fee = EXCLUDED.total_blob_max_fee,
  total_blobs = EXCLUDED.total_blobs,
  total_blob_size = EXCLUDED.total_blob_size,
  total_blob_usage_size = EXCLUDED.total_blob_usage_size,
  total_transactions = EXCLUDED.total_transactions,
  total_unique_blobs = EXCLUDED.total_unique_blobs,
  total_unique_receivers = EXCLUDED.total_unique_receivers,
  total_unique_senders = EXCLUDED.total_unique_senders,
  total_max_blob_gas_fee = EXCLUDED.total_max_blob_gas_fee,

  updated_at = now();
