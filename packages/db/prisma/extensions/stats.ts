import { Prisma } from "@prisma/client";

import { curryPrismaExtensionFnSpan } from "../instrumentation";
import type { BlockNumberRange } from "../types";
import type { DatePeriod } from "../utils/dates";
import { buildRawWhereClause } from "../utils/dates";

const startExtensionFnSpan = curryPrismaExtensionFnSpan("stats");

const startBlobDailyStatsModelFnSpan = startExtensionFnSpan("blobDailyStats");
const startBlockDailyStatsModelFnSpan = startExtensionFnSpan("blockDailyStats");
const startTransactionDailyStatsModelFnSpan = startExtensionFnSpan(
  "transactionDailyStats"
);

export const statsExtension = Prisma.defineExtension((prisma) =>
  prisma.$extends({
    name: "Stats Extension",
    model: {
      blobDailyStats: {
        deleteAll() {
          return startBlobDailyStatsModelFnSpan("deleteAll", () => {
            return prisma.$executeRawUnsafe("TRUNCATE TABLE blob_daily_stats");
          });
        },
        fill(datePeriod: DatePeriod) {
          const dateField = Prisma.sql`bl."timestamp"`;
          const whereClause = buildRawWhereClause(dateField, datePeriod);

          return prisma.$executeRaw`
          INSERT INTO blob_daily_stats (
            "day",
            total_blobs,
            total_unique_blobs,
            total_blob_size,
            avg_blob_size
          )
          SELECT 
            DATE_TRUNC('day', ${dateField}) AS "day",
            COUNT(btx.blob_hash)::INT AS total_blobs,
            COUNT(DISTINCT b.versioned_hash)::INT AS total_unique_blobs,
            SUM(b.size) AS total_blob_size,
            AVG(b.size)::FLOAT AS avg_blob_size
          FROM blob b
            JOIN blobs_on_transactions btx ON btx.blob_hash = b.versioned_hash
            JOIN "transaction" tx ON tx."hash" = btx.tx_hash
            JOIN "block" bl ON bl."number" = tx.block_number
          ${whereClause}
          GROUP BY "day"
          ON CONFLICT ("day") DO UPDATE SET
            total_blobs = EXCLUDED.total_blobs,
            total_unique_blobs = EXCLUDED.total_unique_blobs,
            total_blob_size = EXCLUDED.total_blob_size,
            avg_blob_size = EXCLUDED.avg_blob_size
        `;
        },
      },
      blobOverallStats: {
        backfill() {
          return prisma.$executeRaw`
              INSERT INTO blob_overall_stats (
                id,
                total_blobs,
                total_unique_blobs,
                total_blob_size,
                avg_blob_size,
                updated_at
              )
              SELECT
                1 AS id,
                COUNT(btx.blob_hash)::INT AS total_blobs,
                COUNT(DISTINCT b.versioned_hash)::INT AS total_unique_blobs,
                SUM(b.size) AS total_blob_size,
                AVG(b.size)::FLOAT AS avg_blob_size,
                NOW() AS updated_at
              FROM blob b
              JOIN blobs_on_transactions btx ON btx.blob_hash = b.versioned_hash
              ON CONFLICT (id) DO UPDATE SET
                total_blobs = EXCLUDED.total_blobs,
                total_unique_blobs = EXCLUDED.total_unique_blobs,
                total_blob_size = EXCLUDED.total_blob_size,
                avg_blob_size = EXCLUDED.avg_blob_size,
                updated_at = EXCLUDED.updated_at
            `;
        },
        increment({ from, to }: BlockNumberRange) {
          return prisma.$executeRaw`
              INSERT INTO blob_overall_stats AS st (
                id,
                total_blobs,
                total_unique_blobs,
                total_blob_size,
                avg_blob_size,
                updated_at
              )
              SELECT 
                1 AS id,
                COUNT(btx.blob_hash)::INT AS total_blobs,
                COUNT(DISTINCT CASE WHEN b.first_block_number BETWEEN ${from} AND ${to} THEN b.versioned_hash END)::INT AS total_unique_blobs,
                SUM(b.size) AS total_blob_size,
                AVG(b.size)::FLOAT AS avg_blob_size,
                NOW() AS updated_at
              FROM blob b
                JOIN blobs_on_transactions btx ON btx.blob_hash = b.versioned_hash
                JOIN "transaction" tx ON tx."hash" = btx.tx_hash
                JOIN "block" bck ON bck."number" = tx.block_number
              WHERE bck."number" BETWEEN ${from} AND ${to}
              ON CONFLICT (id) DO UPDATE SET
                total_blobs = st.total_blobs + EXCLUDED.total_blobs,
                total_unique_blobs = st.total_unique_blobs + EXCLUDED.total_unique_blobs,
                total_blob_size = st.total_blob_size + EXCLUDED.total_blob_size,
                avg_blob_size = st.avg_blob_size + ((EXCLUDED.avg_blob_size - st.avg_blob_size) / (st.total_blobs + EXCLUDED.total_blobs)),
                updated_at = EXCLUDED.updated_at
            `;
        },
      },
      blockDailyStats: {
        deleteAll() {
          return startBlockDailyStatsModelFnSpan("deleteAll", () => {
            return prisma.$executeRawUnsafe(`TRUNCATE TABLE block_daily_stats`);
          });
        },
        fill(datePeriod: DatePeriod) {
          const dateField = Prisma.sql`timestamp`;
          const whereClause = buildRawWhereClause(dateField, datePeriod);

          return prisma.$executeRaw`
            INSERT INTO block_daily_stats (
              day,
              total_blocks,
              total_blob_gas_used,
              total_blob_as_calldata_gas_used,
              total_blob_fee,
              total_blob_as_calldata_fee,
              avg_blob_fee,
              avg_blob_as_calldata_fee,
              avg_blob_gas_price
            )
            SELECT
              DATE_TRUNC('day', ${dateField}) as "day",
              COUNT(hash)::INT as total_blocks,
              SUM(blob_gas_used)::DECIMAL as total_blob_gas_used,
              SUM(blob_as_calldata_gas_used)::DECIMAL as total_blob_as_calldata_gas_used,
              SUM(blob_gas_used * blob_gas_price)::DECIMAL as total_blob_fee,
              SUM(blob_as_calldata_gas_used * blob_gas_price)::DECIMAL as total_blob_as_calldata_fee,
              AVG(blob_gas_used * blob_gas_price)::FLOAT as avg_blob_fee,
              AVG(blob_as_calldata_gas_used * blob_gas_price)::FLOAT as avg_blob_as_calldata_fee,
              AVG(blob_gas_price)::FLOAT as avg_blob_gas_price
            FROM "block"
            ${whereClause}
            GROUP BY "day"
            ON CONFLICT (day) DO UPDATE SET
              total_blocks = EXCLUDED.total_blocks,
              total_blob_gas_used = EXCLUDED.total_blob_gas_used,
              total_blob_as_calldata_gas_used = EXCLUDED.total_blob_as_calldata_gas_used,
              total_blob_fee = EXCLUDED.total_blob_fee,
              total_blob_as_calldata_fee = EXCLUDED.total_blob_as_calldata_fee,
              avg_blob_fee = EXCLUDED.avg_blob_fee,
              avg_blob_as_calldata_fee = EXCLUDED.avg_blob_as_calldata_fee,
              avg_blob_gas_price = EXCLUDED.avg_blob_gas_price
          `;
        },
      },
      blockOverallStats: {
        backfill() {
          return prisma.$executeRaw`
              INSERT INTO block_overall_stats as st (
                id,
                total_blocks,
                total_blob_gas_used,
                total_blob_as_calldata_gas_used,
                total_blob_fee,
                total_blob_as_calldata_fee,
                avg_blob_fee,
                avg_blob_as_calldata_fee,
                avg_blob_gas_price,
                updated_at
              )
              SELECT
                1 as id,
                COUNT("hash")::INT as total_blocks,
                SUM(blob_gas_used)::DECIMAL(50,0) as total_blob_gas_used,
                SUM(blob_as_calldata_gas_used)::DECIMAL(50,0) as total_blob_as_calldata_gas_used,
                SUM(blob_gas_used * blob_gas_price)::DECIMAL(50,0) as total_blob_fee,
                SUM(blob_as_calldata_gas_used * blob_gas_price)::DECIMAL(50,0) as total_blob_as_calldata_fee,
                AVG(blob_gas_used * blob_gas_price)::FLOAT as avg_blob_fee,
                AVG(blob_as_calldata_gas_used * blob_gas_price)::FLOAT as avg_blob_as_calldata_fee,
                AVG(blob_gas_price)::FLOAT as avg_blob_gas_price,
                NOW() as updated_at
              FROM "block"
              ON CONFLICT (id) DO UPDATE SET
                total_blocks = EXCLUDED.total_blocks,
                total_blob_gas_used = EXCLUDED.total_blob_gas_used,
                total_blob_as_calldata_gas_used = EXCLUDED.total_blob_as_calldata_gas_used,
                total_blob_fee = EXCLUDED.total_blob_fee,
                total_blob_as_calldata_fee = EXCLUDED.total_blob_as_calldata_fee,
                avg_blob_fee = EXCLUDED.avg_blob_fee,
                avg_blob_as_calldata_fee = EXCLUDED.avg_blob_as_calldata_fee,
                avg_blob_gas_price = EXCLUDED.avg_blob_gas_price,
                updated_at = EXCLUDED.updated_at
            `;
        },
        increment({ from, to }: BlockNumberRange) {
          return prisma.$executeRaw`
              INSERT INTO block_overall_stats AS st (
                id,
                total_blocks,
                total_blob_gas_used,
                total_blob_as_calldata_gas_used,
                total_blob_fee,
                total_blob_as_calldata_fee,
                avg_blob_fee,
                avg_blob_as_calldata_fee,
                avg_blob_gas_price,
                updated_at
              )
              SELECT
                1 as id,
                COUNT("hash")::INT as total_blocks,
                SUM(blob_gas_used)::DECIMAL(50,0) as total_blob_gas_used,
                SUM(blob_as_calldata_gas_used)::DECIMAL(50,0) as total_blob_as_calldata_gas_used,
                SUM(blob_gas_used * blob_gas_price)::DECIMAL(50,0) as total_blob_fee,
                SUM(blob_as_calldata_gas_used * blob_gas_price)::DECIMAL(50,0) as total_blob_as_calldata_fee,
                AVG(blob_gas_used * blob_gas_price)::FLOAT as avg_blob_fee,
                AVG(blob_as_calldata_gas_used * blob_gas_price)::FLOAT as avg_blob_as_calldata_fee,
                AVG(blob_gas_price)::FLOAT as avg_blob_gas_price,
                NOW() as updated_at
              FROM "block"
              WHERE "number" BETWEEN ${from} AND ${to}
              ON CONFLICT (id) DO UPDATE SET
                total_blocks = st.total_blocks + EXCLUDED.total_blocks,
                total_blob_gas_used = st.total_blob_gas_used + EXCLUDED.total_blob_gas_used,
                total_blob_as_calldata_gas_used = st.total_blob_as_calldata_gas_used + EXCLUDED.total_blob_as_calldata_gas_used,
                total_blob_fee = st.total_blob_fee + EXCLUDED.total_blob_fee,
                total_blob_as_calldata_fee = st.total_blob_as_calldata_fee + EXCLUDED.total_blob_as_calldata_fee,
                avg_blob_fee = st.avg_blob_fee + ((EXCLUDED.avg_blob_fee - st.avg_blob_fee) / (st.total_blocks + EXCLUDED.total_blocks)),
                avg_blob_as_calldata_fee = st.avg_blob_as_calldata_fee + ((EXCLUDED.avg_blob_as_calldata_fee - st.avg_blob_as_calldata_fee) / (st.total_blocks + EXCLUDED.total_blocks)),
                avg_blob_gas_price = st.avg_blob_gas_price + ((EXCLUDED.avg_blob_gas_price - st.avg_blob_gas_price) / (st.total_blocks + EXCLUDED.total_blocks)),
                updated_at = EXCLUDED.updated_at
            `;
        },
      },
      transactionDailyStats: {
        deleteAll() {
          return startTransactionDailyStatsModelFnSpan("deleteAll", () => {
            return prisma.$executeRawUnsafe(
              `TRUNCATE TABLE transaction_daily_stats`
            );
          });
        },
        fill(datePeriod: DatePeriod) {
          const dateField = Prisma.sql`b."timestamp"`;
          const whereClause = buildRawWhereClause(dateField, datePeriod);

          return prisma.$executeRaw`
            INSERT INTO transaction_daily_stats (
              "day",
              total_transactions,
              total_unique_receivers,
              total_unique_senders,
              avg_max_blob_gas_fee
            )
            SELECT 
              DATE_TRUNC('day', ${dateField}) AS "day",
              COUNT(tx."hash")::INT AS total_transactions,
              COUNT(DISTINCT tx.to_id)::INT AS total_unique_receivers,
              COUNT(DISTINCT tx.from_id)::INT AS total_unique_senders,
              AVG(max_fee_per_blob_gas)::FLOAT AS avg_max_blob_gas_fee
            FROM "transaction" tx
              JOIN "block" b ON b.number = tx.block_number
            ${whereClause}
            GROUP BY "day"
            ON CONFLICT ("day") DO UPDATE SET
              total_transactions = EXCLUDED.total_transactions,
              total_unique_receivers = EXCLUDED.total_unique_receivers,
              total_unique_senders = EXCLUDED.total_unique_senders
            `;
        },
      },
      transactionOverallStats: {
        backfill() {
          return prisma.$executeRaw`
            INSERT INTO transaction_overall_stats (
              id,
              total_transactions,
              total_unique_receivers,
              total_unique_senders,
              avg_max_blob_gas_fee,
              updated_at
            )
            SELECT
              1 AS id,
              COUNT("hash")::INT AS total_transactions,
              COUNT(DISTINCT to_id)::INT AS total_unique_receivers,
              COUNT(DISTINCT from_id)::INT AS total_unique_senders,
              AVG(max_fee_per_blob_gas)::FLOAT AS avg_max_blob_gas_fee,
              NOW() AS updated_at
            FROM "transaction"
            ON CONFLICT (id) DO UPDATE SET
              total_transactions = EXCLUDED.total_transactions,
              total_unique_receivers = EXCLUDED.total_unique_receivers,
              total_unique_senders = EXCLUDED.total_unique_senders,
              avg_max_blob_gas_fee = EXCLUDED.avg_max_blob_gas_fee,
              updated_at = EXCLUDED.updated_at
          `;
        },
        increment({ from, to }: BlockNumberRange) {
          return prisma.$executeRaw`
              INSERT INTO transaction_overall_stats AS st (
                id,
                total_transactions,
                total_unique_receivers,
                total_unique_senders,
                avg_max_blob_gas_fee,
                updated_at
              )
              SELECT
                1 AS id,
                COUNT("hash")::INT AS total_transactions,
                COUNT(DISTINCT CASE WHEN taddr.first_block_number_as_receiver BETWEEN ${from} AND ${to} THEN taddr.address END)::INT AS total_unique_receivers,
                COUNT(DISTINCT CASE WHEN faddr.first_block_number_as_sender BETWEEN ${from} AND ${to} THEN faddr.address END )::INT AS total_unique_senders,
                AVG(max_fee_per_blob_gas)::FLOAT AS avg_max_blob_gas_fee,
                NOW() AS updated_at
              FROM "transaction" tx JOIN "address" faddr ON faddr.address = tx.from_id JOIN "address" taddr ON taddr.address = tx.to_id
              WHERE tx.block_number BETWEEN ${from} AND ${to}
              ON CONFLICT (id) DO UPDATE SET
                total_transactions = st.total_transactions + EXCLUDED.total_transactions,
                total_unique_receivers = st.total_unique_receivers + EXCLUDED.total_unique_receivers,
                total_unique_senders = st.total_unique_senders + EXCLUDED.total_unique_senders,
                avg_max_blob_gas_fee = st.avg_max_blob_gas_fee + ((EXCLUDED.avg_max_blob_gas_fee - st.avg_max_blob_gas_fee) / (st.total_transactions + EXCLUDED.total_transactions)),
                updated_at = EXCLUDED.updated_at
            `;
        },
      },
    },
  })
);

export type StatsExtendedPrismaClient = ReturnType<typeof statsExtension>;
