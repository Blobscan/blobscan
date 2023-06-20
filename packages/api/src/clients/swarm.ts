import { Bee, BeeDebug } from "@ethersphere/bee-js";

import { BEE_DEBUG_ENDPOINT, BEE_ENDPOINT } from "../env";

export const swarm = {
  bee: new Bee(BEE_ENDPOINT),
  beeDebug: new BeeDebug(BEE_DEBUG_ENDPOINT),
};
