import { TRPCError } from "@trpc/server";

import { z } from "@blobscan/zod";

import {
  createExpandsSchema,
  withExpands,
} from "../../middlewares/withExpands";
import { publicProcedure } from "../../procedures";
import { normalize } from "../../utils";
import type { CompletedPrismaBlob } from "./helpers";
import {
  responseBlobSchema,
  createBlobSelect,
  toResponseBlob,
} from "./helpers";

const inputSchema = z
  .object({
    id: z.string(),
  })
  .merge(createExpandsSchema(["transaction", "block"]));

const outputSchema = responseBlobSchema.transform(normalize);

export const getByBlobId = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/blobs/{id}",
      tags: ["blobs"],
      summary:
        "retrieves blob details for given versioned hash or kzg commitment.",
    },
  })
  .input(inputSchema)
  .use(withExpands)
  .output(outputSchema)
  .query(async ({ ctx: { prisma, expands }, input }) => {
    const { id } = input;
    const isExpandEnabled = !!expands.block || !!expands.transaction;

    const [prismaBlob, ethUsdPrices] = await Promise.all([
      prisma.blob.findFirst({
        select: createBlobSelect(expands),
        where: {
          OR: [{ versionedHash: id }, { commitment: id }],
        },
      }) as unknown as Promise<CompletedPrismaBlob | null>,
      isExpandEnabled ? prisma.blob.findEthUsdPrices(id) : Promise.resolve([]),
    ]);

    if (!prismaBlob) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No blob with versioned hash or kzg commitment '${id}'.`,
      });
    }

    return toResponseBlob(
      prismaBlob,
      ethUsdPrices.map(({ price }) => price)
    );
  });
