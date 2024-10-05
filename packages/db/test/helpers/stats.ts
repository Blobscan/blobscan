import { toDailyDate } from "@blobscan/dayjs";
import { omitDBTimestampFields } from "@blobscan/test";

import { prisma } from "../../prisma";
import { Category } from "../../prisma/enums";
import type { Rollup } from "../../prisma/enums";
import { NEW_DATA } from "./fixture";

export type AggregableType = Category | Rollup | "TOTAL" | "ROLLUPS_TOTAL";

export function indexBlock({ indexAsReorged = false } = {}) {
  const operations = [
    prisma.block.createMany({ data: NEW_DATA.blocks }),
    prisma.transaction.createMany({ data: NEW_DATA.transactions }),
    prisma.blob.createMany({ data: NEW_DATA.blobs }),
    prisma.blobsOnTransactions.createMany({
      data: NEW_DATA.blobsOnTransactions,
    }),
  ];

  if (indexAsReorged) {
    const transactionForkData = NEW_DATA.blocks.flatMap((b) => {
      const blockTxs = NEW_DATA.transactions.filter(
        (tx) => tx.blockHash === b.hash
      );

      return blockTxs.map((tx) => ({
        blockHash: b.hash,
        hash: tx.hash,
      }));
    });

    operations.push(
      prisma.transactionFork.createMany({
        data: transactionForkData,
      })
    );
  }

  return prisma.$transaction(operations);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function getOverallStats(overallStatsModel: any) {
  return (
    overallStatsModel
      .findFirst()
      /* eslint-disable @typescript-eslint/no-explicit-any */
      .then((res: any) => (res ? omitDBTimestampFields(res) : res))
  );
}

function getObjectFieldValue(obj: any, path: string) {
  return path.split(".").reduce((acc, key) => acc[key], obj);
}

export function groupElementsByDay<T>({
  elements,
  timeFieldName,
}: {
  elements: T[];
  timeFieldName: string;
}): Map<string, T[]> {
  return elements.reduce<Map<string, T[]>>((grouped, el) => {
    const day = toDailyDate(
      getObjectFieldValue(el, timeFieldName),
      "startOf"
    ).toISOString();

    if (!grouped.has(day)) {
      grouped.set(day, []);
    }

    grouped.get(day)?.push(el);

    return grouped;
  }, new Map());
}

export function groupElementsByAggregableType<
  T extends { category: Category; rollup?: Rollup | null }
>(elements: T[]): Map<AggregableType, T[]> {
  return elements.reduce<Map<AggregableType, T[]>>(
    (grouped, el) => {
      const type = el.rollup ?? el.category;

      if (!grouped.has(type)) {
        grouped.set(type, []);
      }

      grouped.get(type)?.push(el);

      if (el.rollup) {
        grouped.get("ROLLUPS_TOTAL")?.push(el);
      }

      grouped.get("TOTAL")?.push(el);

      return grouped;
    },
    new Map([
      ["TOTAL", []],
      ["ROLLUPS_TOTAL", []],
    ])
  );
}

export function getElementByAggregableType<
  T extends { category?: Category | null; rollup?: Rollup | null }
>(elements: T[], type: AggregableType): T | undefined {
  return elements.find(({ category, rollup }) => {
    if (type === "TOTAL") {
      return category === null && rollup === null;
    }

    if (type === "ROLLUPS_TOTAL") {
      return category === "ROLLUP";
    }

    if (Object.values(Category).includes(type as Category)) {
      return category === type;
    }

    return rollup === type;
  });
}
