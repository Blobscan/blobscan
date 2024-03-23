import { z } from "@blobscan/zod";

import { createExpandKeysSchema } from "../../middlewares/withExpands";
import { serializedBlobSchema } from "./common/serializers";

export const getByBlobIdInputSchema = z
  .object({
    id: z.string(),
  })
  .merge(createExpandKeysSchema(["block", "transaction"]));

export const getByBlobIdOutputSchema = serializedBlobSchema;
