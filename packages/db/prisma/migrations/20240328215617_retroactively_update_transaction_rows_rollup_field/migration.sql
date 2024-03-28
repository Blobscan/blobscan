-- Update the `rollup` field for transactions that were created before the `rollup` field was added to the schema.
UPDATE "transaction"
SET "rollup" = CASE
    WHEN "from_id" = '0xa9268341831efa4937537bc3e9eb36dbece83c7e' THEN 'linea'::rollup
    WHEN "from_id" = '0xc70ae19b5feaa5c19f576e621d2bad9771864fe2' THEN 'paradex'::rollup
    WHEN "from_id" = '0x99199a22125034c808ff20f377d91187e8050f2e' THEN 'mode'::rollup
    WHEN "from_id" = '0x625726c858dbf78c0125436c943bf4b4be9d9033' THEN 'zora'::rollup
    ELSE NULL
END
WHERE "from_id" IN ('0xa9268341831efa4937537bc3e9eb36dbece83c7e', '0xc70ae19b5feaa5c19f576e621d2bad9771864fe2', '0x99199a22125034c808ff20f377d91187e8050f2e', '0x625726c858dbf78c0125436c943bf4b4be9d9033');