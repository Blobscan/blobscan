import type { BlobscanPrismaClient } from "@blobscan/db";

// The Dagster pipeline populates the metrics tables in production. These
// queries follow the same logic as the Dagster aggregation SQL
// (apps/dagster/src/analytics/defs/sql), but they aggregate by day. Tests use
// them to fill the metrics tables from the fixtures data.

const MAX_DATE = "9999-12-31T00:00:00.000Z";

const AGGREGATE_TX_DAILY_METRICS_SQL = `
WITH base AS (
  SELECT
    DATE_TRUNC('day', tx.block_timestamp) AS period_start,
    CASE WHEN f.rollup IS NOT NULL THEN 'rollup'::category ELSE 'other'::category END AS category,
    f.rollup,
    tx.block_number,
    tx.hash,
    tx.to_id,
    t.first_block_number_as_receiver                         AS to_first_block_number,
    tx.from_id,
    f.first_block_number_as_sender                           AS from_first_block_number,
    b.blob_gas_price,
    tx.blob_gas_used,
    tx.blob_as_calldata_gas_used,
    tx.max_fee_per_blob_gas,
    (tx.blob_gas_used * b.blob_gas_price)                    AS blob_base_fee,
    (tx.blob_gas_used * tx.max_fee_per_blob_gas)             AS blob_max_fee,
    (tx.blob_as_calldata_gas_used * b.blob_gas_price)        AS blob_as_calldata_fee,
    (tx.blob_as_calldata_gas_used * tx.max_fee_per_blob_gas) AS blob_as_calldata_max_fee
  FROM transaction tx
    JOIN block b ON b.hash = tx.block_hash
    JOIN address f ON f.address = tx.from_id
    JOIN address t ON t.address = tx.to_id
  WHERE tx.block_timestamp < $1::timestamp
    AND NOT EXISTS (
      SELECT 1 FROM transaction_fork tx_f
      WHERE tx_f.block_hash = tx.block_hash AND tx_f.hash = tx.hash
    )
),
block_metric AS (
  SELECT
    period_start,
    SUM(blob_gas_price)::DECIMAL AS total_blob_gas_price,
    COUNT(*)::INT AS total_blocks
  FROM (
    SELECT DISTINCT ON (block_number) period_start, block_number, blob_gas_price
    FROM base
  ) deduped_blocks
  GROUP BY period_start
)
INSERT INTO daily_metrics (
  period_start,
  category,
  rollup,
  total_blob_gas_price,
  total_blocks,
  total_transactions,
  total_unique_receivers,
  total_unique_senders,
  total_blob_gas_used,
  total_blob_as_calldata_gas_used,
  total_blob_base_fee,
  total_blob_max_fee,
  total_blob_as_calldata_fee,
  total_blob_as_calldata_max_fee,
  total_max_blob_gas_fee
)
SELECT
  base.period_start,
  category,
  rollup,
  CASE WHEN GROUPING(category) = 1 AND GROUPING(rollup) = 1
    THEN COALESCE(ANY_VALUE(total_blob_gas_price), 0)
  END,
  CASE WHEN GROUPING(category) = 1 AND GROUPING(rollup) = 1
    THEN COALESCE(ANY_VALUE(total_blocks), 0)
  END,
  COUNT(hash)::INT,
  COUNT(DISTINCT CASE WHEN to_first_block_number = block_number THEN to_id END)::INT,
  COUNT(DISTINCT CASE WHEN from_first_block_number = block_number THEN from_id END)::INT,
  COALESCE(SUM(blob_gas_used)::DECIMAL, 0),
  COALESCE(SUM(blob_as_calldata_gas_used)::DECIMAL, 0),
  COALESCE(SUM(blob_base_fee)::DECIMAL, 0),
  COALESCE(SUM(blob_max_fee)::DECIMAL, 0),
  COALESCE(SUM(blob_as_calldata_fee)::DECIMAL, 0),
  COALESCE(SUM(blob_as_calldata_max_fee)::DECIMAL, 0),
  COALESCE(SUM(max_fee_per_blob_gas)::DECIMAL, 0)
FROM base JOIN block_metric ON base.period_start = block_metric.period_start
GROUP BY GROUPING SETS (
  (base.period_start, category),
  (base.period_start, rollup),
  (base.period_start)
)
HAVING NOT (GROUPING(rollup) = 0 AND rollup IS NULL)
`;

const AGGREGATE_BLOB_DAILY_METRICS_SQL = `
WITH base AS (
  SELECT
    DATE_TRUNC('day', bl_tx.block_timestamp) AS period_start,
    CASE WHEN f.rollup IS NOT NULL THEN 'rollup'::category ELSE 'other'::category END AS category,
    f.rollup,
    bl_tx.blob_hash,
    bl_tx.block_number,
    b.first_block_number,
    b.size,
    b.usage_size
  FROM blob b
    JOIN blobs_on_transactions bl_tx ON bl_tx.blob_hash = b.versioned_hash
    JOIN transaction tx ON tx.hash = bl_tx.tx_hash
    JOIN address f ON f.address = tx.from_id
  WHERE bl_tx.block_timestamp < $1::timestamp
    AND NOT EXISTS (
      SELECT 1 FROM transaction_fork tx_f
      WHERE tx_f.block_hash = bl_tx.block_hash AND tx_f.hash = bl_tx.tx_hash
    )
)
INSERT INTO daily_metrics (
  period_start,
  category,
  rollup,
  total_blobs,
  total_unique_blobs,
  total_blob_size,
  total_blob_usage_size
)
SELECT
  period_start,
  category,
  rollup,
  COUNT(blob_hash)::INT,
  COUNT(DISTINCT CASE WHEN first_block_number = block_number THEN blob_hash END),
  COALESCE(SUM(size), 0),
  COALESCE(SUM(usage_size), 0)
FROM base
GROUP BY GROUPING SETS (
  (period_start, category),
  (period_start, rollup),
  (period_start)
)
HAVING NOT (GROUPING(rollup) = 0 AND rollup IS NULL)
ON CONFLICT (period_start, category, rollup) DO UPDATE SET
  total_blobs = EXCLUDED.total_blobs,
  total_unique_blobs = EXCLUDED.total_unique_blobs,
  total_blob_size = EXCLUDED.total_blob_size,
  total_blob_usage_size = EXCLUDED.total_blob_usage_size
`;

const AGGREGATE_ETH_PRICE_DAILY_METRICS_SQL = `
INSERT INTO daily_metrics (
  period_start,
  category,
  rollup,
  total_eth_price,
  total_eth_price_samples,
  max_eth_price,
  min_eth_price
)
SELECT
  DATE_TRUNC('day', p.timestamp),
  NULL::category,
  NULL::rollup,
  SUM(p.price)::DOUBLE PRECISION,
  COUNT(*)::INT,
  MAX(p.price)::DOUBLE PRECISION,
  MIN(p.price)::DOUBLE PRECISION
FROM eth_usd_price p
WHERE p.timestamp < $1::timestamp
GROUP BY DATE_TRUNC('day', p.timestamp)
ON CONFLICT (period_start, category, rollup) DO UPDATE SET
  total_eth_price = EXCLUDED.total_eth_price,
  total_eth_price_samples = EXCLUDED.total_eth_price_samples,
  max_eth_price = EXCLUDED.max_eth_price,
  min_eth_price = EXCLUDED.min_eth_price
`;

const AGGREGATE_ALL_TIME_METRICS_SQL = `
INSERT INTO all_time_metrics (
  category,
  rollup,
  total_blob_base_fee,
  total_blob_gas_price,
  total_blocks,
  total_eth_price,
  total_eth_price_samples,
  max_eth_price,
  min_eth_price,
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
  total_max_blob_gas_fee
)
SELECT
  category,
  rollup,
  SUM(total_blob_base_fee),
  SUM(total_blob_gas_price),
  SUM(total_blocks),
  SUM(total_eth_price),
  SUM(total_eth_price_samples),
  MAX(max_eth_price),
  MIN(min_eth_price),
  SUM(total_blob_as_calldata_fee),
  SUM(total_blob_as_calldata_gas_used),
  SUM(total_blob_as_calldata_max_fee),
  SUM(total_blob_gas_used),
  SUM(total_blob_max_fee),
  SUM(total_blobs),
  SUM(total_blob_size),
  SUM(total_blob_usage_size),
  SUM(total_transactions),
  SUM(total_unique_blobs),
  SUM(total_unique_receivers),
  SUM(total_unique_senders),
  SUM(total_max_blob_gas_fee)
FROM daily_metrics
GROUP BY category, rollup
`;

/**
 * Fills the daily and all-time metrics tables from the data in the database.
 * It only uses the data before `to`.
 */
export async function aggregateMetrics(
  prisma: BlobscanPrismaClient,
  { to = MAX_DATE }: { to?: string } = {}
) {
  await prisma.$transaction([
    prisma.dailyMetrics.deleteMany(),
    prisma.allTimeMetrics.deleteMany(),
    prisma.$executeRawUnsafe(AGGREGATE_TX_DAILY_METRICS_SQL, to),
    prisma.$executeRawUnsafe(AGGREGATE_BLOB_DAILY_METRICS_SQL, to),
    prisma.$executeRawUnsafe(AGGREGATE_ETH_PRICE_DAILY_METRICS_SQL, to),
    prisma.$executeRawUnsafe(AGGREGATE_ALL_TIME_METRICS_SQL),
  ]);
}
