-- Update the `rollup` field for transactions that were created before the `rollup` field was added to the schema.
UPDATE "transaction"
SET "rollup" = CASE
    WHEN "from_id" = '0xf15dc770221b99c98d4aaed568f2ab04b9d16e42' THEN 'kroma'::rollup
    WHEN "from_id" = '0x2d567ece699eabe5afcd141edb7a4f2d0d6ce8a0' THEN 'scroll'::rollup
    ELSE NULL
END
WHERE "from_id" IN ('0xf15dc770221b99c98d4aaed568f2ab04b9d16e42', '0x2d567ece699eabe5afcd141edb7a4f2d0d6ce8a0');