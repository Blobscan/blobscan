export { api } from "@opentelemetry/sdk-node";
export {
  SemanticAttributes,
  SemanticResourceAttributes,
} from "@opentelemetry/semantic-conventions";
export * from "@opentelemetry/sdk-metrics";
export { collectDefaultMetrics, register as promRegister } from "prom-client";

export { env } from "./env";
export { setUpOpenTelemetry } from "./sdk";
