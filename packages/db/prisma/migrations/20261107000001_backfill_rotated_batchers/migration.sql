-- Rotated mainnet batchers of existing rollups. Each address is the batcher
-- that the rollup's L1 contracts accept (see the PR for the evidence).
--
-- The metrics tables store the rollup of each row, so they keep the old
-- "other" attribution until Dagster re-aggregates them. The trigger of
-- 20261107000000_add_address_rollup_change_log logs these updates, and the
-- address_rollup_change_sensor backfills the metrics (see the apps/dagster
-- README).
UPDATE address SET rollup = CASE
  WHEN address = '0x5e70713222faf60c9e9fb69240d06ae6d688563a' THEN 'hashkey'::rollup
  WHEN address = '0x09d1ad25b369a0c48bdf4caab85afd08a3f07044' THEN 'paradex'::rollup
  WHEN address = '0x35376dd47c061bc3b8c8e8d61987019e7ed58f06' THEN 'taiko'::rollup
  WHEN address = '0x9ef649e8746cc47a17708a5e86b2d66c7f6c00d1' THEN 'unichain'::rollup
  WHEN address = '0xcf8225801df6ef90ad3bc86808f574403a309de8' THEN 'zircuit'::rollup
  ELSE rollup
END
WHERE address IN (
  '0x5e70713222faf60c9e9fb69240d06ae6d688563a',
  '0x09d1ad25b369a0c48bdf4caab85afd08a3f07044',
  '0x35376dd47c061bc3b8c8e8d61987019e7ed58f06',
  '0x9ef649e8746cc47a17708a5e86b2d66c7f6c00d1',
  '0xcf8225801df6ef90ad3bc86808f574403a309de8'
);
