export { api } from "@opentelemetry/sdk-node";
export {
  SemanticAttributes,
  SemanticResourceAttributes,
} from "@opentelemetry/semantic-conventions";
export { collectDefaultMetrics, register as promRegister } from "prom-client";

export { setUpOpenTelemetry } from "./sdk";
