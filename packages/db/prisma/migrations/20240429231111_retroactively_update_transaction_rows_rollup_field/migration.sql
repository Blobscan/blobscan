-- Update the `rollup` field for transactions that were created before the `rollup` field was added to the schema.
UPDATE "transaction"
SET "rollup" = CASE
    WHEN "from_id" = '0xe1b64045351b0b6e9821f19b39f81bc4711d2230' THEN 'boba'::rollup
    WHEN "from_id" = '0x08f9f14ff43e112b18c96f0986f28cb1878f1d11' THEN 'camp'::rollup
    WHEN "from_id" = '0x41b8cd6791de4d8f9e0eaf7861ac506822adce12' THEN 'kroma'::rollup
    WHEN "from_id" = '0xc94c243f8fb37223f3eb2f7961f7072602a51b8b' THEN 'metal'::rollup
    WHEN "from_id" = '0x5ead389b57d533a94a0eacd570dc1cc59c25f2d4' THEN 'pgn'::rollup
    WHEN "from_id" = '0xcf2898225ed05be911d3709d9417e86e0b4cfc8f' THEN 'scroll'::rollup
    ELSE NULL
END
WHERE "from_id" IN ('0xe1b64045351b0b6e9821f19b39f81bc4711d2230', '0x08f9f14ff43e112b18c96f0986f28cb1878f1d11', '0x41b8cd6791de4d8f9e0eaf7861ac506822adce12', '0xc94c243f8fb37223f3eb2f7961f7072602a51b8b', '0x5ead389b57d533a94a0eacd570dc1cc59c25f2d4', '0xcf2898225ed05be911d3709d9417e86e0b4cfc8f');