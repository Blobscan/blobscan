/* eslint-disable no-case-declarations */
import type { NextApiRequest, NextApiResponse } from "next";

import { env } from "~/env.mjs";

const RATE_EMOJIS = new Map([
  ["bad", "🙁"],
  ["meh", "😐"],
  ["nice", "🙂"],
]);

export default async function (req: NextApiRequest, res: NextApiResponse) {
  const { message, rate, metadata } = req.body;
  const method = req.method;

  if (!env.FEEDBACK_WEBHOOK_URL) {
    return res.status(500).json({ message: "Feedback is not enabled" });
  }

  try {
    switch (method) {
      case "POST":
        const text = `New Feedback ✨

  Message: ${message ? message : "-"}
  Rate: ${rate ? RATE_EMOJIS.get(rate) : "-"}
  Metadata: \`\`\`${JSON.stringify(metadata)}\`\`\``;

        await fetch(env.FEEDBACK_WEBHOOK_URL, {
          method: "POST",
          body: JSON.stringify({ content: text }),
          headers: { "Content-Type": "application/json" },
        });

        return res.status(200).json({ message: "success" });

      default:
        throw new Error("Method not allowed");
    }
  } catch (err) {
    let message = err;

    if (err instanceof TypeError) {
      message = err.message;
    }

    return res.status(400).json({ message });
  }
}
