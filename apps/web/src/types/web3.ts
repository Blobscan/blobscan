import type { z } from "zod";

import type { networkSchema } from "~/env.mjs";

export type ChainId = 1 | 100 | 560048 | 11155111;

export type Network = z.infer<typeof networkSchema>;
