import type { NextApiRequest, NextApiResponse } from "next";

import { createTooManyRequestsBody } from "@blobscan/errors";
import { api } from "@blobscan/open-telemetry";

import { env } from "~/env";
import { rateLimited } from "~/rate-limit";

const feedbackMessagesTotalCounter = api.metrics
  .getMeter("blobscan_web")
  .createCounter("blobscan_web_feedback_messages_total", {
    description: "Number of feedback messages",
    valueType: api.ValueType.INT,
  });

export default async function (req: NextApiRequest, res: NextApiResponse) {
  const { message, rate, metadata } = req.body;
  const method = req.method;

  const limit = await rateLimited(req);

  if (limit) {
    res.setHeader("Retry-After", String(limit.retryAfterSeconds));

    return res.status(429).json(
      createTooManyRequestsBody({
        reason: `Too many requests from your address (limit: ${limit.points} per ${limit.durationSeconds} seconds).`,
        retryAfterSeconds: limit.retryAfterSeconds,
      })
    );
  }

  if (!env.FEEDBACK_WEBHOOK_URL) {
    return res.status(500).json({ message: "Feedback is not enabled" });
  }

  if (method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  if (!rate || typeof rate !== "string") {
    return res.status(400).json({ message: "A reaction is required" });
  }

  try {
    const text = `New Feedback ✨

  Message: ${message ? message : "-"}
  Rate: ${rate}
  Metadata: \`\`\`${JSON.stringify(metadata)}\`\`\``;

    const webhookRes = await fetch(env.FEEDBACK_WEBHOOK_URL, {
      method: "POST",
      body: JSON.stringify({ content: text }),
      headers: { "Content-Type": "application/json" },
    });

    if (!webhookRes.ok) {
      return res.status(502).json({ message: "Failed to deliver feedback" });
    }

    feedbackMessagesTotalCounter.add(1);

    return res.status(200).json({ message: "success" });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    return res.status(500).json({ message: errorMessage });
  }
}
