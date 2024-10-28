import { TRPCError } from "@trpc/server";

import { z } from "@blobscan/zod";

import {
  createExpandsSchema,
  withExpands,
} from "../../middlewares/withExpands";
import { publicProcedure } from "../../procedures";
import { retrieveBlobData } from "../../utils";
import { parseDecodedData } from "../../utils/decoded-transaction";
import { getByPartialHash } from "../block/getByPartialHash";
import {
  addDerivedFieldsToTransaction,
  createTransactionSelect,
  serializeTransaction,
  serializedTransactionSchema,
} from "./common";
import type { BaseTransaction } from "./common";

const inputSchema = z
  .object({
    hash: z.string(),
  })
  .merge(createExpandsSchema(["block", "blob", "blob_data"]));

const outputSchema = serializedTransactionSchema;
export const getByHash = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/transactions/{hash}",
      tags: ["transactions"],
      summary: "retrieves transaction details for given transaction hash.",
    },
  })
  .input(inputSchema)
  .use(withExpands)
  .output(outputSchema)
  .query(
    async ({
      ctx: { blobStorageManager, expands, prisma },
      input: { hash },
    }) => {
      const queriedTx: BaseTransaction | null =
        await prisma.transaction.findUnique({
          select: createTransactionSelect(expands),
          where: { hash },
        });

      if (!queriedTx) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No transaction with hash '${hash}'.`,
        });
      }

      if (expands.blobData) {
        await Promise.all(
          queriedTx.blobs.map(async ({ blob }) => {
            if (blob.dataStorageReferences?.length) {
              const data = await retrieveBlobData(blobStorageManager, blob);

              blob.data = data;
            }
          })
        );
      }

      const tx = serializeTransaction(addDerivedFieldsToTransaction(queriedTx));

      if (tx.decodedFields) {
        tx.decodedFields = await addFullBlockHash(tx.decodedFields);
      }

      return tx;
    }
  );

async function addFullBlockHash(decoded: string): Promise<string> {
  const data = parseDecodedData(decoded);

  if (!data) {
    return decoded;
  }

  const hash = await getByPartialHash(data.l1OriginBlockHash);

  if (!hash) {
    return decoded;
  }

  data.l1OriginBlockHash = hash;
  return JSON.stringify(data);
}
