import { useEffect } from "react";
import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from "next";
import { useRouter } from "next/router";
import { z } from "zod";

import { api } from "~/api-client";
import { createServerSideHelpers } from "~/trpc";
import { buildBlockRoute } from "~/utils";

const querySchema = z.object({
  blockNumber: z.coerce.number().nonnegative(),
  direction: z.enum(["prev", "next"]),
});

export async function getServerSideProps(
  ctx: GetServerSidePropsContext<{ blockNumber: string; direction: string }>
) {
  const parsedQueryParamsRes = querySchema.safeParse(ctx.query);

  if (!parsedQueryParamsRes.success) {
    return {
      notFound: true,
    };
  }

  const helpers = createServerSideHelpers();
  const adjacentBlockParams = {
    ...parsedQueryParamsRes.data,
    expand: "transaction,blob",
  };

  await helpers.block.getAdjacentBlock.prefetch(adjacentBlockParams);

  return {
    props: {
      trpcState: helpers.dehydrate(),
      params: adjacentBlockParams,
    },
  };
}

export default function AdjacentBlock(
  props: InferGetServerSidePropsType<typeof getServerSideProps>
) {
  const { params } = props;
  const router = useRouter();
  const utils = api.useUtils();
  const { data: adjacentBlock } = api.block.getAdjacentBlock.useQuery(params);

  useEffect(() => {
    if (!adjacentBlock || !router.isReady) {
      return;
    }

    utils.block.getByBlockId.setData(
      {
        id: adjacentBlock.number.toString(),
        expand: "transaction,blob",
      },
      adjacentBlock
    );

    void router.push(buildBlockRoute(adjacentBlock.number));
  }, [utils, router, adjacentBlock]);
}
