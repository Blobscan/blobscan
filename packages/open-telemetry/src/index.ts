export * as api from "@opentelemetry/api";
export { ATTR_CODE_FUNCTION_NAME } from "@opentelemetry/semantic-conventions";
export { collectDefaultMetrics, register as promRegister } from "prom-client";

export { setUpOpenTelemetry } from "./sdk";
