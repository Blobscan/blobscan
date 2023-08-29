import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";

import dayjs from "@blobscan/dayjs";

import { normalizeDate, buildRawWhereClause } from "./dates";

describe("dates", () => {
  describe("normalizeDate", () => {
    it("should return the end of the day by default", () => {
      const date = dayjs("2022-01-01");
      const result = normalizeDate(date);
      expect(result).toEqual("2022-01-01T23:59:59.999Z");
    });

    it("should return the start of the day when specified", () => {
      const date = dayjs("2022-01-01");
      const result = normalizeDate(date, "startOf");
      expect(result).toEqual("2022-01-01T00:00:00.000Z");
    });

    it("should handle string dates", () => {
      const date = "2022-01-01";
      const result = normalizeDate(date);
      expect(result).toEqual("2022-01-01T23:59:59.999Z");
    });

    it("should handle Date objects", () => {
      const date = new Date("2022-01-01");
      const result = normalizeDate(date);
      expect(result).toEqual("2022-01-01T23:59:59.999Z");
    });
  });

  describe("buildRawWhereClause", () => {
    it("should return a WHERE clause with a BETWEEN statement when both from and to are provided", () => {
      const dateField = Prisma.sql`created_at`;
      const datePeriod = { from: "2022-01-01", to: "2022-01-02" };
      const result = buildRawWhereClause(dateField, datePeriod);
      expect(result).toEqual(
        Prisma.sql`WHERE created_at BETWEEN ${datePeriod.from}::TIMESTAMP AND ${datePeriod.to}::TIMESTAMP`
      );
    });

    it("should return a WHERE clause with a >= statement when only from is provided", () => {
      const dateField = Prisma.sql`created_at`;
      const datePeriod = { from: "2022-01-01" };
      const result = buildRawWhereClause(dateField, datePeriod);
      expect(result).toEqual(
        Prisma.sql`WHERE created_at >= ${datePeriod.from}::TIMESTAMP`
      );
    });

    it("should return a WHERE clause with a < statement when only to is provided", () => {
      const dateField = Prisma.sql`created_at`;
      const datePeriod = { to: "2022-01-01" };
      const result = buildRawWhereClause(dateField, datePeriod);
      expect(result).toEqual(
        Prisma.sql`WHERE created_at < ${datePeriod.to}::TIMESTAMP`
      );
    });

    it("should return an empty WHERE clause when neither from nor to are provided", () => {
      const dateField = Prisma.sql`created_at`;
      const datePeriod = {};
      const result = buildRawWhereClause(dateField, datePeriod);
      expect(result).toEqual(Prisma.empty);
    });
  });
});
