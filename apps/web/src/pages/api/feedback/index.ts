/* eslint-disable no-case-declarations */
import type { NextApiRequest, NextApiResponse } from "next";

const webhook = process.env.FEEDBACK_WEBHOOK_URL;

const rateEmoji = new Map([
  ["bad", "🙁"],
  ["meh", "😐"],
  ["nice", "🙂"],
]);

export default async function (req: NextApiRequest, res: NextApiResponse) {
  const { message, rate, metadata } = req.body;
  const method = req.method;

  if (!webhook) {
    return res.status(200).json({ message: "success" });
  }

  try {
    switch (method) {
      case "POST":
        const text = `New Feedback ✨

  Message: ${message ? message : "-"}
  Rate: ${rate ? rateEmoji.get(rate) : "-"}
  Metadata: \`\`\`${JSON.stringify(metadata)}\`\`\``;

        await fetch(webhook, {
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
