import { utils } from "ethers";
import type { NextApiRequest, NextApiResponse } from "next";

import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const term = (req.query.term as string | undefined) ?? "";

  try {
    const url = await search(term);
    res.status(200).json({ url });
  } catch (e: any) {
    console.error(e);
    res.status(501).json({ error: e.message });
  }

  res.status(200).json({ name: "John Doe" });
}

async function search(term: string) {
  if (utils.isAddress(term)) {
    return `/address/${term}`;
  }

  const blocks = await prisma.block.findMany({
    where: {
      OR: [{ number: parseInt(term) }, { hash: term }],
    },
    take: 1,
  });

  if (blocks.length > 0) {
    return `/block/${blocks[0].number}`;
  }

  const txs = await prisma.transaction.findMany({
    where: { hash: term },
    take: 1,
  });

  if (txs.length > 0) {
    return `/tx/${txs[0].hash}`;
  }

  const blobs = await prisma.blob.findMany({
    where: { OR: [{ hash: term }, { commitment: term }] },
    take: 1,
  });

  if (blobs.length > 0) {
    return `/blob/${blobs[0].hash}`;
  }

  return "/empty";
}
