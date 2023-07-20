import { NextResponse } from "next/server";

import dayjs from "@blobscan/dayjs";
import type { DatePeriod } from "@blobscan/db";
import { prisma } from "@blobscan/db";

import { defaultResponder } from "~/server/default-responder";

async function handler() {
  const yesterday = dayjs().subtract(1, "day");
  const yesterdayPeriod: DatePeriod = {
    from: yesterday.startOf("day").toISOString(),
    to: yesterday.endOf("day").toISOString(),
  };

  await Promise.all([
    prisma.blobDailyStats.fill(yesterdayPeriod),
    prisma.blockDailyStats.fill(yesterdayPeriod),
    prisma.transactionDailyStats.fill(yesterdayPeriod),
  ]);

  return new NextResponse(JSON.stringify({ success: true }), {
    status: 200,
  });
}

export default defaultResponder(handler);
