-- Checks for sepolia's known rollups at the moment
UPDATE "transaction"
SET "rollup" = CASE
    WHEN "from_id" = '0xb2248390842d3c4acf1d8a893954afc0eac586e5' THEN 'arbitrum'::rollup
    WHEN "from_id" = '0x6cdebe940bc0f26850285caca097c11c33103e47' THEN 'base'::rollup
    WHEN "from_id" = '0x8f23bb38f531600e5d8fddaaec41f13fab46e98c' THEN 'optimism'::rollup
    WHEN "from_id" = '0x5b98b836969a60fec50fa925905dd1d382a7db43' THEN 'starknet'::rollup
    ELSE NULL
END
WHERE "from_id" IN ('0xb2248390842d3c4acf1d8a893954afc0eac586e5', '0x6cdebe940bc0f26850285caca097c11c33103e47', '0x8f23bb38f531600e5d8fddaaec41f13fab46e98c', '0x5b98b836969a60fec50fa925905dd1d382a7db43');