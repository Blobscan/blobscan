import { publicProcedure } from "../../procedures";
import { t } from "../../trpc-client";
import { getPrice } from "./fetchPrice";

export const priceRouter = t.router({
  getEthPrice: publicProcedure.query(() => getPrice("ethereum")),
});
