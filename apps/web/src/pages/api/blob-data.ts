import type { NextApiRequest, NextApiResponse } from "next";

import { env } from "~/env.mjs";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  if (env.BLOB_DATA_API_ENABLED === false) {
    return res.status(204).json({
      message:
        "This endpoint is disabled. You must retrieve blob data from the storage directly.",
    });
  }

  const url = req.query.url as string | undefined;

  if (!url) {
    return res.status(400).json({ message: "Blob Data URL is required" });
  }

  const requestInit: RequestInit | undefined = env.BLOB_DATA_API_KEY
    ? {
        headers: {
          Authorization: `Bearer ${env.BLOB_DATA_API_KEY}`,
        },
      }
    : undefined;

  try {
    const response = await fetch(url, requestInit);

    if (!response.ok) {
      return res.status(response.status).json({ message: response.statusText });
    }

    const blobData = (await response.json()) as string;

    return res.status(200).json(blobData);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch blob data" });
  }
}
