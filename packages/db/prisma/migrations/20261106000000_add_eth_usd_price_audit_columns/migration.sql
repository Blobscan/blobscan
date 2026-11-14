-- Add the Chainlink feeds that the ETH price syncer reads, and the audit
-- columns of "eth_usd_price": the round of the price, the time of the round,
-- the feed that gave the price, and the times when the row was written. Old
-- rows keep NULL in the new columns.

-- CreateTable
CREATE TABLE "price_feed" (
    "id" SERIAL NOT NULL,
    "chain_id" INTEGER NOT NULL,
    "address" VARCHAR(42) NOT NULL,
    "description" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_feed_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "price_feed_chain_id_address_key" ON "price_feed"("chain_id", "address");

-- AlterTable
ALTER TABLE "eth_usd_price"
    ADD COLUMN "round_id" DECIMAL(25,0),
    ADD COLUMN "round_timestamp" TIMESTAMP(3),
    ADD COLUMN "price_feed_id" INTEGER,
    ADD COLUMN "created_at" TIMESTAMP(3),
    ADD COLUMN "updated_at" TIMESTAMP(3);

-- Set the default after the column exists. If the default is in ADD COLUMN,
-- Postgres writes the migration time into all the old rows.
ALTER TABLE "eth_usd_price" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "eth_usd_price" ADD CONSTRAINT "eth_usd_price_price_feed_id_fkey" FOREIGN KEY ("price_feed_id") REFERENCES "price_feed"("id") ON DELETE SET NULL ON UPDATE CASCADE;
