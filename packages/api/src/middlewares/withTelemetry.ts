import type { api } from "@blobscan/open-telemetry";

import { tracer } from "../instrumentation";
import { t } from "../trpc-client";

function getProcedureFromUrl(url: string) {
  const procedure = url
    .split("/")
    .find((_, i, urlSplitted) => {
      const prevPath = urlSplitted[i - 1];

      return prevPath === "trpc";
    })
    // remove query params
    ?.split("?")[0];

  return procedure;
}
export const withTelemetry = t.middleware(({ ctx: { req }, next }) => {
  const procedureName = req?.url ? getProcedureFromUrl(req.url) : "unknown";
  const spanOptions: api.SpanOptions = {};
  let spanName: string;

  if (procedureName) {
    spanName = "trpc";
    spanOptions.attributes = {
      procedure: procedureName,
    };
  } else {
    spanName = "trpc_open_api";
    spanOptions.attributes = {
      path: req.url ?? "unknown-path",
    };
  }

  return tracer.startActiveSpan(spanName, spanOptions, async (span) => {
    const result = await next();

    span.end();

    return result;
  });
});
