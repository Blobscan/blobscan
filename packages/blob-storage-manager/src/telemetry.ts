import { api } from "@blobscan/open-telemetry";

import { name } from "../package.json";

export const tracer = api.trace.getTracer(name);
