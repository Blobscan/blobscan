import type { NextApiRequest, NextApiResponse } from "next";

import { env } from "~/env";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  const storage = req.query.storage as string | undefined;
  const url = req.query.url as string | undefined;

  if (!storage) {
    return res.status(400).json({ message: "Blob data storage is required" });
  }

  if (!url) {
    return res.status(400).json({ message: "Blob Data URL is required" });
  }

  const isBlobscanStorageRef = storage === "postgres";

  let requestInit: RequestInit | undefined;

  if (isBlobscanStorageRef) {
    requestInit = env.BLOB_DATA_API_KEY
      ? {
          headers: {
            Authorization: `Bearer ${env.BLOB_DATA_API_KEY}`,
          },
        }
      : undefined;
  }

  try {
    const response = await fetch(url, requestInit);

    if (!response.ok) {
      return res.status(response.status).json({ message: response.statusText });
    }

    const contentType = response.headers.get("content-type");
    const isBinaryFile =
      url.endsWith(".bin") || contentType === "application/octet-stream";
    const isTextPlainFile =
      url.endsWith(".txt") ||
      contentType === "text/plain" ||
      contentType === "application/x-www-form-urlencoded";
    let blobData: Buffer;

    if (isBlobscanStorageRef) {
      const data = await response.json();

      if (typeof data !== "string" || !data.startsWith("0x")) {
        return res.status(500).json({
          message: `Unexpected content fetched from storage ${storage} and url ${url}`,
        });
      }

      blobData = Buffer.from(data.slice(2));
    } else if (isTextPlainFile) {
      const data = await response.text();

      blobData = Buffer.from(data.slice(2), "hex");
    } else if (isBinaryFile) {
      const blobBytes = await response.arrayBuffer();

      blobData = Buffer.from(blobBytes);
    } else {
      throw new Error(
        `Unexpected content type "${contentType}" for URL "${url}"`
      );
    }

    res.setHeader("Content-Type", "application/octet-stream");

    return res.status(200).send(blobData);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch blob data" });
  }
}
