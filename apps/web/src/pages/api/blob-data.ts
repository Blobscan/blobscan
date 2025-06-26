import type { NextApiRequest, NextApiResponse } from "next";

import { env } from "~/env.mjs";

export default async function (req: NextApiRequest, res: NextApiResponse) {
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

    if (url.endsWith(".txt")) {
      const blobData = (await response.json()) as string;

      return res.status(200).json(blobData);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    return buffer.toString("hex");
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch blob data" });
  }
}
