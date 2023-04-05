import { utils } from "ethers";
import type { NextApiRequest, NextApiResponse } from "next";

import { api } from "~/utils/api";

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

  const { data: blocks } = api.block.getAll.useQuery({
    blockId: term,
    take: 1,
  });

  if (blocks && blocks.length > 0) {
    return `/block/${blocks[0].number}`;
  }

  const { data: txs } = api.tx.getAll.useQuery({ hash: term, take: 1 });

  if (txs && txs.length > 0) {
    return `/tx/${txs[0].hash}`;
  }

  const { data: blobs } = api.blob.getAll.useQuery({
    blobId: term,
    take: 1,
  });

  if (blobs && blobs.length > 0) {
    return `/blob/${blobs[0].hash}`;
  }

  return "/empty";
}
