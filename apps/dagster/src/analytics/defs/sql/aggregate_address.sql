-- Metrics of each address for the [:from, :to) window, one row for each
-- address and {{trunc}}. The hourly and the daily assets both read the raw
-- tables with this SQL, so a daily partition does not need the hourly rows.
--
-- Each transaction counts two times: as `sent` for its sender and as
-- `received` for its receiver. A self-send (from = to) counts in both roles
-- and in self_total_transactions and self_total_blobs.
WITH tx AS (
  SELECT
    DATE_TRUNC('{{trunc}}', tx.block_timestamp) AS period_start,
    tx.hash,
    tx.from_id,
    tx.to_id,
    tx.block_timestamp,
    (tx.blob_gas_used * b.blob_gas_price)                            AS blob_base_fee,
    (tx.blob_as_calldata_gas_used * tx.gas_price)                    AS blob_as_calldata_fee,
    -- The same USD conversion as aggregate_tx_hourly.sql: the price of the
    -- block minute only, and NULL when that minute has no price.
    (tx.blob_gas_used * b.blob_gas_price * p.price * 1e-18)          AS blob_base_fee_usd,
    (tx.blob_as_calldata_gas_used * tx.gas_price * p.price * 1e-18)  AS blob_as_calldata_fee_usd
  FROM transaction tx
    JOIN block b ON b.hash = tx.block_hash
    LEFT JOIN eth_usd_price p ON p.timestamp = DATE_TRUNC('minute', tx.block_timestamp)
  WHERE tx.block_timestamp >= :from AND tx.block_timestamp < :to
    AND NOT EXISTS (
      SELECT 1 FROM transaction_fork tx_f
      WHERE tx_f.block_hash = tx.block_hash AND tx_f.hash = tx.hash
    )
),
tx_blobs AS (
  SELECT
    bl_tx.tx_hash,
    COUNT(*)::INT       AS blobs,
    SUM(bl.usage_size)  AS usage_size
  FROM blobs_on_transactions bl_tx
    JOIN blob bl ON bl.versioned_hash = bl_tx.blob_hash
  WHERE bl_tx.block_timestamp >= :from AND bl_tx.block_timestamp < :to
  GROUP BY bl_tx.tx_hash
),
tx_full AS (
  SELECT
    tx.*,
    COALESCE(tb.blobs, 0)       AS blobs,
    COALESCE(tb.usage_size, 0)  AS usage_size
  FROM tx LEFT JOIN tx_blobs tb ON tb.tx_hash = tx.hash
),
roles AS (
  SELECT period_start, from_id AS address, TRUE AS is_sent, (from_id = to_id) AS is_self,
    block_timestamp, blobs, usage_size, blob_base_fee, blob_as_calldata_fee,
    blob_base_fee_usd, blob_as_calldata_fee_usd
  FROM tx_full
  UNION ALL
  SELECT period_start, to_id AS address, FALSE AS is_sent, FALSE AS is_self,
    block_timestamp, blobs, usage_size, blob_base_fee, blob_as_calldata_fee,
    blob_base_fee_usd, blob_as_calldata_fee_usd
  FROM tx_full
)
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
  period_start,
  address,

  COUNT(*) FILTER (WHERE is_sent)::INT AS sent_total_transactions,
  COALESCE(SUM(blobs) FILTER (WHERE is_sent), 0)::INT AS sent_total_blobs,
  COALESCE(SUM(usage_size) FILTER (WHERE is_sent), 0) AS sent_total_blob_usage_size,
  COALESCE(SUM(blob_base_fee) FILTER (WHERE is_sent), 0) AS sent_total_blob_base_fee,
  COALESCE(SUM(blob_as_calldata_fee) FILTER (WHERE is_sent), 0) AS sent_total_blob_as_calldata_fee,
  -- No COALESCE: the USD fees stay NULL when no transaction has a price.
  SUM(blob_base_fee_usd) FILTER (WHERE is_sent) AS sent_total_blob_base_fee_usd,
  SUM(blob_as_calldata_fee_usd) FILTER (WHERE is_sent) AS sent_total_blob_as_calldata_fee_usd,
  COUNT(blob_base_fee_usd) FILTER (WHERE is_sent)::INT AS sent_total_usd_priced_transactions,
  MIN(block_timestamp) FILTER (WHERE is_sent) AS sent_first_block_timestamp,
  MAX(block_timestamp) FILTER (WHERE is_sent) AS sent_last_block_timestamp,

  COUNT(*) FILTER (WHERE NOT is_sent)::INT AS received_total_transactions,
  COALESCE(SUM(blobs) FILTER (WHERE NOT is_sent), 0)::INT AS received_total_blobs,
  COALESCE(SUM(usage_size) FILTER (WHERE NOT is_sent), 0) AS received_total_blob_usage_size,
  COALESCE(SUM(blob_base_fee) FILTER (WHERE NOT is_sent), 0) AS received_total_blob_base_fee,
  COALESCE(SUM(blob_as_calldata_fee) FILTER (WHERE NOT is_sent), 0) AS received_total_blob_as_calldata_fee,
  SUM(blob_base_fee_usd) FILTER (WHERE NOT is_sent) AS received_total_blob_base_fee_usd,
  SUM(blob_as_calldata_fee_usd) FILTER (WHERE NOT is_sent) AS received_total_blob_as_calldata_fee_usd,
  COUNT(blob_base_fee_usd) FILTER (WHERE NOT is_sent)::INT AS received_total_usd_priced_transactions,
  MIN(block_timestamp) FILTER (WHERE NOT is_sent) AS received_first_block_timestamp,
  MAX(block_timestamp) FILTER (WHERE NOT is_sent) AS received_last_block_timestamp,

  COUNT(*) FILTER (WHERE is_self)::INT AS self_total_transactions,
  COALESCE(SUM(blobs) FILTER (WHERE is_self), 0)::INT AS self_total_blobs,

  now() AS updated_at
FROM roles
GROUP BY period_start, address
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
