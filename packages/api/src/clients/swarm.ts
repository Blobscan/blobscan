import { Bee, BeeDebug } from "@ethersphere/bee-js";

import { env } from "../env";

export const swarm = {
  bee: new Bee(env.BEE_ENDPOINT),
  beeDebug: new BeeDebug(env.BEE_DEBUG_ENDPOINT),
};
