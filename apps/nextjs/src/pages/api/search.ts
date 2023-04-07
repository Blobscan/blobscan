import type { NextApiRequest, NextApiResponse } from "next";
import { utils } from "ethers";

import { api } from "~/utils/api";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const term = (req.query.term as string | undefined) ?? "";

  try {
    const url = search(term);
    res.status(200).json({ url });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    console.error(e);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    res.status(501).json({ error: e.message });
  }
}

function search(term: string) {
  if (utils.isAddress(term)) {
    return `/address/${term}`;
  }

  const { data: block } = api.block.byId.useQuery({
    id: term,
  });

  if (block) {
    return `/block/${block.number}`;
  }

  const { data: tx } = api.tx.byId.useQuery({ id: term });

  if (tx) {
    return `/tx/${tx.hash}`;
  }

  const { data: blob } = api.blob.byId.useQuery({
    id: term,
  });

  if (blob) {
    return `/blob/${blob.hash}`;
  }

  return "/empty";
}
