import type { GetServerSideProps } from "next";
import z from "zod";

import { getPrisma } from "@blobscan/db";

const QuerySchema = z.object({
  blockNumber: z.coerce.number().nonnegative().int(),
  direction: z.enum(["next", "prev"]),
});

type Query = z.infer<typeof QuerySchema>;

const prisma = getPrisma();

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const result = QuerySchema.safeParse(ctx.query);

  if (!result.success) {
    return {
      notFound: true,
    };
  }

  const neighbor = await findAdjacentBlockNumber(result.data);

  if (neighbor) {
    return {
      redirect: {
        permanent: true,
        destination: `/block/${neighbor.number}`,
      },
    };
  }

  return {
    notFound: true,
  };
};

async function findAdjacentBlockNumber({ blockNumber, direction }: Query) {
  if (direction === "next") {
    return prisma.block.findFirst({
      where: {
        number: {
          gt: blockNumber,
        },
      },
      orderBy: {
        number: "asc",
      },
      select: {
        number: true,
      },
    });
  }

  return prisma.block.findFirst({
    where: {
      number: {
        lt: blockNumber,
      },
    },
    orderBy: {
      number: "desc",
    },
    select: {
      number: true,
    },
  });
}

export default function BlockNeighbor() {
  return null;
}
