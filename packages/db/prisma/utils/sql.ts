import { Prisma } from "@prisma/client";

import type { DatePeriod } from "./dates";

export const updatedAtField = Prisma.sql`updated_at`;

export function buildRawWhereClause(
  dateField: Prisma.Sql,
  { from, to }: DatePeriod
): Prisma.Sql {
  if (from && to) {
    return Prisma.sql`WHERE ${dateField} BETWEEN ${from}::TIMESTAMP AND ${to}::TIMESTAMP`;
  } else if (from) {
    return Prisma.sql`WHERE ${dateField} >= ${from}::TIMESTAMP`;
  } else if (to) {
    return Prisma.sql`WHERE ${dateField} < ${to}::TIMESTAMP`;
  }

  return Prisma.empty;
}

export function buildWhereClause(dateField: string, { from, to }: DatePeriod) {
  return { [dateField]: { gte: from, lte: to } };
}

export function buildAvgUpdateExpression(
  tableAlias: Prisma.Sql,
  totalItemsField: Prisma.Sql,
  avgFieldName: Prisma.Sql
) {
  const prefixedTotalItemsField = Prisma.sql`${tableAlias}.${Prisma.sql`${totalItemsField}`}`;
  const prefixedAvgField = Prisma.sql`${tableAlias}.${Prisma.sql`${avgFieldName}`}`;
  const excludedTotalItemsField = Prisma.sql`EXCLUDED.${Prisma.sql`${totalItemsField}`}`;
  const excludedAvgField = Prisma.sql`EXCLUDED.${Prisma.sql`${avgFieldName}`}`;

  return Prisma.sql`
    CASE
      WHEN ${prefixedTotalItemsField} + ${excludedTotalItemsField} = 0 THEN 0
      ELSE ${prefixedAvgField} + ((${excludedAvgField} - ${prefixedAvgField}) / (${prefixedTotalItemsField} + ${excludedTotalItemsField}))
    END
  `;
}

export function coalesceToZero(value: string) {
  return Prisma.sql`COALESCE(${Prisma.sql([value])}, 0)`;
}
