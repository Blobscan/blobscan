-- Update the `rollup` field for transactions that were created before the `rollup` field was added to the schema.
UPDATE "transaction"
SET "rollup" = CASE
    WHEN "from_id" = '0x415c8893d514f9bc5211d36eeda4183226b84aa7' THEN 'blast'::rollup
    WHEN "from_id" = '0x3d0bf26e60a689a7da5ea3ddad7371f27f7671a5' THEN 'optopia'::rollup
    WHEN "from_id" = '0x000000633b68f5d8d3a86593ebb815b4663bcbe0' THEN 'taiko'::rollup
    ELSE NULL
END
WHERE "from_id" IN ('0x415c8893d514f9bc5211d36eeda4183226b84aa7', '0x3d0bf26e60a689a7da5ea3ddad7371f27f7671a5', '0x000000633b68f5d8d3a86593ebb815b4663bcbe0');