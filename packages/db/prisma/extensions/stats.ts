import { Prisma } from "@prisma/client";

import { curryPrismaExtensionFnSpan } from "../instrumentation";
import type { BlockNumberRange } from "../types";
import type { RawDatePeriod } from "../utils/dates";
import { normalizeDailyDatePeriod } from "../utils/dates";
import {
  buildAvgUpdateExpression,
  buildRawWhereClause,
  coalesceToZero,
  updatedAtField,
} from "../utils/sql";

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
        populate(dailyDatePeriod?: RawDatePeriod) {
          const normalizedDailyDatePeriod =
            normalizeDailyDatePeriod(dailyDatePeriod);
          const dateField = Prisma.sql`bl."timestamp"`;
          const whereClause = buildRawWhereClause(
            dateField,
            normalizedDailyDatePeriod
          );

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
            JOIN "block" bl ON bl."hash" = tx.block_hash
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
        populate() {
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
          const statsTableAlias = Prisma.sql`bos`;
          const totalBlobsField = Prisma.sql`total_blobs`;
          const totalUniqueBlobsField = Prisma.sql`total_unique_blobs`;
          const totalBlobSizeField = Prisma.sql`total_blob_size`;
          const avgBlobSizeField = Prisma.sql`avg_blob_size`;

          return prisma.$executeRaw`
              INSERT INTO blob_overall_stats AS ${statsTableAlias} (
                id,
                ${totalBlobsField},
                ${totalUniqueBlobsField},
                ${totalBlobSizeField},
                ${avgBlobSizeField},
                ${updatedAtField}
              )
              SELECT 
                1 AS id,
                ${coalesceToZero(
                  "COUNT(btx.blob_hash)::INT"
                )} AS ${totalBlobsField},
                ${coalesceToZero(
                  `COUNT(DISTINCT CASE WHEN b.first_block_number BETWEEN ${from} AND ${to} THEN b.versioned_hash END)::INT`
                )} AS total_unique_blobs,
                ${coalesceToZero("SUM(b.size)")} AS ${totalBlobSizeField},
                ${coalesceToZero("AVG(b.size)::FLOAT")} AS ${avgBlobSizeField},
                NOW() AS updated_at
              FROM blob b
                JOIN blobs_on_transactions btx ON btx.blob_hash = b.versioned_hash
                JOIN "transaction" tx ON tx."hash" = btx.tx_hash
                JOIN "block" bck ON bck."hash" = tx.block_hash
                LEFT JOIN "transaction_fork" tf ON tf."block_hash" = bck."hash" AND tf."hash" = tx."hash"
              WHERE bck."number" BETWEEN ${from} AND ${to} AND tf."hash" IS NULL
              ON CONFLICT (id) DO UPDATE SET
                ${totalBlobsField} = ${Prisma.sql`${statsTableAlias}.${totalBlobsField}`} + ${Prisma.sql`EXCLUDED.${totalBlobsField}`},
                ${totalUniqueBlobsField} = ${Prisma.sql`${statsTableAlias}.${totalUniqueBlobsField}`} + ${Prisma.sql`EXCLUDED.${totalUniqueBlobsField}`},
                ${totalBlobSizeField} = ${Prisma.sql`${statsTableAlias}.${totalBlobSizeField}`} + ${Prisma.sql`EXCLUDED.${totalBlobSizeField}`},
                ${avgBlobSizeField} = ${buildAvgUpdateExpression(
            statsTableAlias,
            totalBlobsField,
            avgBlobSizeField
          )},
                ${updatedAtField} = ${Prisma.sql`EXCLUDED.${updatedAtField}`}
            `;
        },
      },
      blockDailyStats: {
        deleteAll() {
          return startBlockDailyStatsModelFnSpan("deleteAll", () => {
            return prisma.$executeRawUnsafe(`TRUNCATE TABLE block_daily_stats`);
          });
        },
        populate(dailyDatePeriod?: RawDatePeriod) {
          const normalizedDailyDatePeriod =
            normalizeDailyDatePeriod(dailyDatePeriod);
          const dateField = Prisma.sql`timestamp`;
          const whereClause = buildRawWhereClause(
            dateField,
            normalizedDailyDatePeriod
          );

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
        populate() {
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
          const statsTableAlias = Prisma.sql`bos`;
          const totalBlocksField = Prisma.sql`total_blocks`;
          const totalBlobGasUsedField = Prisma.sql`total_blob_gas_used`;
          const totalBlobAsCalldataGasUsedField = Prisma.sql`total_blob_as_calldata_gas_used`;
          const totalBlobFeeField = Prisma.sql`total_blob_fee`;
          const totalBlobAsCalldataFeeField = Prisma.sql`total_blob_as_calldata_fee`;
          const avgBlobFeeField = Prisma.sql`avg_blob_fee`;
          const avgBlobAsCalldataFeeField = Prisma.sql`avg_blob_as_calldata_fee`;
          const avgBlobGasPriceField = Prisma.sql`avg_blob_gas_price`;

          return prisma.$executeRaw`
              INSERT INTO block_overall_stats AS ${statsTableAlias} (
                id,
                ${totalBlocksField},
                ${totalBlobGasUsedField},
                ${totalBlobAsCalldataGasUsedField},
                ${totalBlobFeeField},
                ${totalBlobAsCalldataFeeField},
                ${avgBlobFeeField},
                ${avgBlobAsCalldataFeeField},
                ${avgBlobGasPriceField},
                updated_at
              )
              SELECT
                1 as id,
                ${coalesceToZero(
                  `COUNT(bck."hash")::INT`
                )} as ${totalBlocksField},
                ${coalesceToZero(
                  `SUM(blob_gas_used)::DECIMAL(50,0)`
                )} as ${totalBlobGasUsedField},
                ${coalesceToZero(
                  `SUM(blob_as_calldata_gas_used)::DECIMAL(50,0)`
                )} as ${totalBlobAsCalldataGasUsedField},
                ${coalesceToZero(
                  `SUM(blob_gas_used * blob_gas_price)::DECIMAL(50,0)`
                )} as ${totalBlobFeeField},
                ${coalesceToZero(
                  `SUM(blob_as_calldata_gas_used * blob_gas_price)::DECIMAL(50,0)`
                )} as ${totalBlobAsCalldataFeeField},
                ${coalesceToZero(
                  `AVG(blob_gas_used * blob_gas_price)::FLOAT`
                )} as ${avgBlobFeeField},
                ${coalesceToZero(
                  `AVG(blob_as_calldata_gas_used * blob_gas_price)::FLOAT`
                )} as ${avgBlobAsCalldataFeeField},
                ${coalesceToZero(
                  `AVG(blob_gas_price)::FLOAT`
                )} as ${avgBlobGasPriceField},
                NOW() as ${updatedAtField}
              FROM "block" bck
              LEFT JOIN "transaction_fork" tf ON tf."block_hash" = bck."hash"
              WHERE "number" BETWEEN ${from} AND ${to} AND tf."block_hash" IS NULL
              ON CONFLICT (id) DO UPDATE SET
                ${totalBlocksField} = ${Prisma.sql`${statsTableAlias}.${totalBlocksField}`} + ${Prisma.sql`EXCLUDED.${totalBlocksField}`},
                ${totalBlobGasUsedField} = ${Prisma.sql`${statsTableAlias}.${totalBlobGasUsedField}`} + ${Prisma.sql`EXCLUDED.${totalBlobGasUsedField}`},
                ${totalBlobAsCalldataGasUsedField} = ${Prisma.sql`${statsTableAlias}.${totalBlobAsCalldataGasUsedField}`} + ${Prisma.sql`EXCLUDED.${totalBlobAsCalldataGasUsedField}`},
                ${totalBlobFeeField} = ${Prisma.sql`${statsTableAlias}.${totalBlobFeeField}`} + ${Prisma.sql`EXCLUDED.${totalBlobFeeField}`},
                ${totalBlobAsCalldataFeeField} = ${Prisma.sql`${statsTableAlias}.${totalBlobAsCalldataFeeField}`} + ${Prisma.sql`EXCLUDED.${totalBlobAsCalldataFeeField}`},
                ${avgBlobFeeField} = ${buildAvgUpdateExpression(
            statsTableAlias,
            totalBlocksField,
            avgBlobFeeField
          )},
                ${avgBlobAsCalldataFeeField} = ${buildAvgUpdateExpression(
            statsTableAlias,
            totalBlocksField,
            avgBlobAsCalldataFeeField
          )},
                ${avgBlobGasPriceField} = ${buildAvgUpdateExpression(
            statsTableAlias,
            totalBlocksField,
            avgBlobGasPriceField
          )},
                ${updatedAtField} = ${Prisma.sql`EXCLUDED.${updatedAtField}`}
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
        populate(dailyDatePeriod?: RawDatePeriod) {
          const normalizedDailyDatePeriod =
            normalizeDailyDatePeriod(dailyDatePeriod);
          const dateField = Prisma.sql`b."timestamp"`;
          const whereClause = buildRawWhereClause(
            dateField,
            normalizedDailyDatePeriod
          );

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
              JOIN "block" b ON b.hash = tx.block_hash
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
        populate() {
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
          const statsTableAlias = Prisma.sql`tos`;
          const totalTransactionsField = Prisma.sql`total_transactions`;
          const totalUniqueReceiversField = Prisma.sql`total_unique_receivers`;
          const totalUniqueSendersField = Prisma.sql`total_unique_senders`;
          const avgMaxBlobGasFeeField = Prisma.sql`avg_max_blob_gas_fee`;

          return prisma.$executeRaw`
              INSERT INTO transaction_overall_stats AS ${statsTableAlias} (
                id,
                ${totalTransactionsField},
                ${totalUniqueReceiversField},
                ${totalUniqueSendersField},
                ${avgMaxBlobGasFeeField},
                ${updatedAtField}
              )
              SELECT
                1 AS id,
                ${coalesceToZero(
                  "COUNT(tx.hash)::INT"
                )} AS ${totalTransactionsField},
                ${coalesceToZero(
                  `COUNT(DISTINCT CASE WHEN taddr.first_block_number_as_receiver BETWEEN ${from} AND ${to} THEN taddr.address END)::INT`
                )} AS ${totalUniqueReceiversField},
                ${coalesceToZero(
                  `COUNT(DISTINCT CASE WHEN faddr.first_block_number_as_sender BETWEEN ${from} AND ${to} THEN faddr.address END )::INT`
                )} AS ${totalUniqueSendersField},
                ${coalesceToZero(
                  "AVG(max_fee_per_blob_gas)::FLOAT"
                )} AS ${avgMaxBlobGasFeeField},
                NOW() AS ${updatedAtField}
              FROM "transaction" tx
                JOIN "block" b ON b.hash = tx.block_hash
                JOIN "address" faddr ON faddr.address = tx.from_id
                JOIN "address" taddr ON taddr.address = tx.to_id
                LEFT JOIN "transaction_fork" tf ON tf."block_hash" = b."hash" AND tf."hash" = tx."hash"
              WHERE b."number" BETWEEN ${from} AND ${to} AND tf."hash" IS NULL
              ON CONFLICT (id) DO UPDATE SET
                ${totalTransactionsField} = ${Prisma.sql`${statsTableAlias}.${totalTransactionsField}`} + ${Prisma.sql`EXCLUDED.${totalTransactionsField}`},
                ${totalUniqueReceiversField} = ${Prisma.sql`${statsTableAlias}.${totalUniqueReceiversField}`} + ${Prisma.sql`EXCLUDED.${totalUniqueReceiversField}`},
                ${totalUniqueSendersField} = ${Prisma.sql`${statsTableAlias}.${totalUniqueSendersField}`} + ${Prisma.sql`EXCLUDED.${totalUniqueSendersField}`},
                ${avgMaxBlobGasFeeField} = ${buildAvgUpdateExpression(
            statsTableAlias,
            totalTransactionsField,
            avgMaxBlobGasFeeField
          )},
                ${updatedAtField} = ${Prisma.sql`EXCLUDED.${updatedAtField}`}
            `;
        },
      },
    },
  })
);

export type StatsExtendedPrismaClient = ReturnType<typeof statsExtension>;
