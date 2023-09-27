/* eslint-disable no-case-declarations */
import type { NextApiRequest, NextApiResponse } from "next";

const webhooks = [
  process.env.FEEDBACK_WEBHOOK_URL ??
    "https://discord.com/api/webhooks/abc/123",
];

const rateEmoji = new Map([
  ["bad", "🙁"],
  ["meh", "😐"],
  ["nice", "🙂"],
]);

export default async function (req: NextApiRequest, res: NextApiResponse) {
  const { message, rate, metadata } = req.body;
  const method = req.method;

  try {
    switch (method) {
      case "POST":
        const text = `New Feedback ✨

Message: ${message ? message : "-"}
Rate: ${rate ? rateEmoji.get(rate) : "-"}
Metadata: \`\`\`${JSON.stringify(metadata)}\`\`\``;

        const requests = webhooks.map(async (webhook) => {
          return fetch(webhook, {
            method: "POST",
            body: JSON.stringify({ content: text }),
            headers: { "Content-Type": "application/json" },
          });
        });

        await Promise.all(requests);

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
