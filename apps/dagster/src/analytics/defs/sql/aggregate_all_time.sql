WITH cutoffs AS (
  SELECT
    date_trunc('year',  now()) AS cur_year,
    date_trunc('month', now()) AS cur_month,
    date_trunc('day',   now()) AS cur_day,
    date_trunc('hour',  now()) AS cur_hour
),

unioned AS (
  -- YEARLY: all completed years
  SELECT y.*
  FROM yearly_metrics y
  CROSS JOIN cutoffs c
  WHERE y.period_start < c.cur_year

  UNION ALL

  -- MONTHLY: completed months within the current year (not covered by yearly)
  SELECT m.*
  FROM monthly_metrics m
  CROSS JOIN cutoffs c
  WHERE m.period_start >= c.cur_year
    AND m.period_start <  c.cur_month

  UNION ALL

  -- DAILY: completed days within the current month (not covered by monthly)
  SELECT d.*
  FROM daily_metrics d
  CROSS JOIN cutoffs c
  WHERE d.period_start >= c.cur_month
    AND d.period_start <  c.cur_day

  UNION ALL

  -- HOURLY: hours within the current day (not covered by daily)
  SELECT h.*
  FROM hourly_metrics h
  CROSS JOIN cutoffs c
  WHERE h.period_start >= c.cur_day
    AND h.period_start <= c.cur_hour
),

aggregated AS (
  SELECT
    u.category,
    u.rollup,

    -- counters
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
    SUM(u.total_max_blob_gas_fee)           AS total_max_blob_gas_fee,

    -- averages: total / count, as in aggregate.sql
    (SUM(u.total_blob_base_fee) / NULLIF(SUM(u.total_transactions), 0))::float            AS avg_blob_base_fee,
    (SUM(u.total_blob_gas_price) / NULLIF(SUM(u.total_blocks), 0))::float                 AS avg_blob_gas_price,
    (SUM(u.total_blob_as_calldata_fee) / NULLIF(SUM(u.total_transactions), 0))::float     AS avg_blob_as_calldata_fee,
    (SUM(u.total_blob_as_calldata_max_fee) / NULLIF(SUM(u.total_transactions), 0))::float AS avg_blob_as_calldata_max_fee,
    (SUM(u.total_blob_max_fee) / NULLIF(SUM(u.total_transactions), 0))::float             AS avg_blob_max_fee,
    (SUM(u.total_blob_usage_size) / NULLIF(SUM(u.total_blobs), 0))::float                 AS avg_blob_usage_size,
    (SUM(u.total_max_blob_gas_fee) / NULLIF(SUM(u.total_transactions), 0))::float         AS avg_max_blob_gas_fee

  FROM unioned u
  GROUP BY u.category, u.rollup
)

INSERT INTO all_time_metrics (
  category,
  rollup,

  avg_blob_base_fee,
  avg_blob_gas_price,

  total_blob_base_fee,
  total_blob_gas_price,
  total_blocks,

  avg_blob_as_calldata_fee,
  avg_blob_as_calldata_max_fee,
  avg_blob_max_fee,
  avg_blob_usage_size,
  avg_max_blob_gas_fee,

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
  avg_blob_base_fee,
  avg_blob_gas_price,
  total_blob_base_fee,
  total_blob_gas_price,
  total_blocks,

  avg_blob_as_calldata_fee,
  avg_blob_as_calldata_max_fee,
  avg_blob_max_fee,
  avg_blob_usage_size,
  avg_max_blob_gas_fee,

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
  avg_blob_base_fee = EXCLUDED.avg_blob_base_fee,
  avg_blob_gas_price = EXCLUDED.avg_blob_gas_price,
  total_blob_base_fee = EXCLUDED.total_blob_base_fee,
  total_blob_gas_price = EXCLUDED.total_blob_gas_price,
  total_blocks = EXCLUDED.total_blocks,

  avg_blob_as_calldata_fee = EXCLUDED.avg_blob_as_calldata_fee,
  avg_blob_as_calldata_max_fee = EXCLUDED.avg_blob_as_calldata_max_fee,
  avg_blob_max_fee = EXCLUDED.avg_blob_max_fee,
  avg_blob_usage_size = EXCLUDED.avg_blob_usage_size,
  avg_max_blob_gas_fee = EXCLUDED.avg_max_blob_gas_fee,

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
