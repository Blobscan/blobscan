-- CreateTable
CREATE TABLE "blob_storages_state" (
    "id" SERIAL NOT NULL,
    "swarm_data_id" TEXT,
    "swarm_data_ttl" INTEGER,

    CONSTRAINT "blob_storages_state_pkey" PRIMARY KEY ("id")
);
