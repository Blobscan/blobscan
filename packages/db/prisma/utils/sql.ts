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
  const prevTotalItemsField = Prisma.sql`${tableAlias}.${Prisma.sql`${totalItemsField}`}`;
  const prevAvgField = Prisma.sql`${tableAlias}.${Prisma.sql`${avgFieldName}`}`;
  const newTotalItemsFields = Prisma.sql`EXCLUDED.${Prisma.sql`${totalItemsField}`}`;
  const newAvgField = Prisma.sql`EXCLUDED.${Prisma.sql`${avgFieldName}`}`;

  return Prisma.sql`
    CASE
      WHEN ${prevTotalItemsField} = 0 AND ${newTotalItemsFields} = 0 THEN 0
      WHEN ${newAvgField} = 0 THEN ${prevAvgField}
      ELSE ${prevAvgField} + ((${newAvgField} - ${prevAvgField}) / (${prevTotalItemsField} + ${newTotalItemsFields}))
    END
  `;
}

export function coalesceToZero(value: string) {
  return Prisma.sql`COALESCE(${Prisma.sql([value])}, 0)`;
}
