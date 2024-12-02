import { expect, it, vi } from "vitest";

import dayjs from "@blobscan/dayjs";
import { prisma } from "@blobscan/db";

export function runHelpArgTests(
  command: (argv?: string[]) => unknown,
  expectedDisplayedUsage: string
) {
  it("should display the command usage when the help flag is given", async () => {
    const consoleLogSpy = vi
      .spyOn(console, "log")
      .mockImplementationOnce(() => void {});

    await command(["-h"]);

    expect(
      consoleLogSpy,
      "Usage displayed more than once"
    ).toHaveBeenCalledOnce();
    expect(consoleLogSpy, "Invalid usage displayed").toHaveBeenCalledWith(
      expectedDisplayedUsage
    );
  });
}

export function toDailyFormat(date: string | Date | dayjs.Dayjs) {
  return dayjs(date).toISOString().split("T")[0];
}

function sortByDay(a: { day: string | Date }, b: { day: string | Date }) {
  return new Date(a.day).getTime() - new Date(b.day).getTime();
}

export function getDailyStats() {
  return prisma.dailyStats
    .findMany()
    .then((stats) => stats.map(({ id: _, ...rest }) => rest).sort(sortByDay));
}

export async function getDailyStatsByDateRange({
  fromDate,
  toDate,
  invertRange = false,
}: Partial<{
  fromDate: string;
  toDate: string;
  invertRange: boolean;
}>) {
  const from = fromDate ? dayjs(new Date(fromDate)).startOf("day") : undefined;
  const to = toDate ? dayjs(new Date(toDate)).endOf("day") : undefined;

  const dailyStats = await prisma.dailyStats.findMany();

  return dailyStats
    .filter((b) => {
      let isInRange;
      if (!from) {
        isInRange = dayjs(b.day).isBefore(to, "day");
      } else if (!to) {
        isInRange = dayjs(b.day).isAfter(from, "day");
      } else {
        isInRange = dayjs(b.day).isBetween(from, to, "day", "[]");
      }

      return invertRange ? !isInRange : isInRange;
    })
    .sort(sortByDay);
}
