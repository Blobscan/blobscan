-- CreateTable
CREATE TABLE "eth_usd_price" (
    "id" SERIAL NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eth_usd_price_pkey" PRIMARY KEY ("id")
);
