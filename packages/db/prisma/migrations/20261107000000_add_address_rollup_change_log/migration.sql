-- CreateTable
CREATE TABLE "address_rollup_change" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "old_rollup" "rollup",
    "new_rollup" "rollup",
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "address_rollup_change_pkey" PRIMARY KEY ("id")
);

-- Log each change of address.rollup, from migrations and from the indexer
-- (its upsert sets the rollup of the registry on every conflict). The Dagster
-- address_rollup_change_sensor reads the log to re-aggregate the metrics of
-- the changed addresses.
--
-- Inserts are not logged: an address row is inserted before its
-- transactions, so their metrics are aggregated with its rollup.
CREATE FUNCTION log_address_rollup_change() RETURNS trigger AS $$
BEGIN
  INSERT INTO address_rollup_change (address, old_rollup, new_rollup)
  VALUES (NEW.address, OLD.rollup, NEW.rollup);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER address_rollup_change_log
AFTER UPDATE OF rollup ON address
FOR EACH ROW
WHEN (OLD.rollup IS DISTINCT FROM NEW.rollup)
EXECUTE FUNCTION log_address_rollup_change();
