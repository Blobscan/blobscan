-- The ETH price metrics are global-only metrics. Thus, only the global row
-- (no category and no rollup) gets them. The row can already exist, because
-- the transaction aggregation creates it.
INSERT INTO hourly_metrics (
  period_start,
  category,
  rollup,

  total_eth_price,
  total_eth_price_count,
  max_eth_price,
  min_eth_price
)
SELECT
  DATE_TRUNC('hour', p.timestamp) AS period_start,
  NULL::category AS category,
  NULL::rollup AS rollup,

  SUM(p.price)::DOUBLE PRECISION AS total_eth_price,
  COUNT(*)::INT AS total_eth_price_count,
  MAX(p.price)::DOUBLE PRECISION AS max_eth_price,
  MIN(p.price)::DOUBLE PRECISION AS min_eth_price
FROM eth_usd_price p
WHERE p.timestamp >= :from AND p.timestamp < :to
GROUP BY DATE_TRUNC('hour', p.timestamp)
ON CONFLICT (period_start, category, rollup) DO UPDATE SET
  total_eth_price = EXCLUDED.total_eth_price,
  total_eth_price_count = EXCLUDED.total_eth_price_count,
  max_eth_price = EXCLUDED.max_eth_price,
  min_eth_price = EXCLUDED.min_eth_price
