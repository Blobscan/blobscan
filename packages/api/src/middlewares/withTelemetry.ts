import { api } from "@blobscan/open-telemetry";

import type { CreateContextOptions } from "../context";
import { meter, tracer } from "../instrumentation";
import { t } from "../trpc-client";

type RequestData = {
  scope: string;
  endpoint: string;
  status_code: string;
  method: string;
};

const apiRequestsTotalCounter = meter.createCounter<RequestData>(
  "blobscan_api_requests_total",
  {
    valueType: api.ValueType.INT,
    description:
      "Number of requests made to Blobscan API by endpoint, status_code and method",
  }
);

const apiRequestsDurationMsHistogram = meter.createHistogram<RequestData>(
  "blobscan_api_requests_duration_ms",
  {
    description: "Duration of all the requests made to Blobscan API",
    valueType: api.ValueType.INT,
    unit: "ms",
  }
);

function buildURL(req: CreateContextOptions["req"]) {
  return new URL(req.url ?? "", `http://${req.headers.host}`);
}

function getTRPCProcedure(url: URL) {
  const procedure = url.pathname
    .split("/")
    .find((_, i, urlSplitted) => urlSplitted[i - 1] === "trpc");

  return procedure;
}

export const withTelemetry = t.middleware(
  async ({ ctx: { req, res, scope, enableTracing }, next }) => {
    if (!enableTracing) {
      return next();
    }

    const url = buildURL(req);
    const endpoint = url.pathname;
    const procedureName = getTRPCProcedure(url);

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
        path: endpoint,
      };
    }

    const requestStart = performance.now();
    try {
      const result = await tracer.startActiveSpan(
        spanName,
        spanOptions,
        async (span) => {
          const result = await next();

          span.end();

          return result;
        }
      );

      return result;
    } finally {
      const requestEnd = performance.now();

      const requestData: RequestData = {
        scope,
        status_code: res.statusCode.toString(),
        endpoint,
        method: req.method ?? "",
      };

      apiRequestsDurationMsHistogram.record(
        requestEnd - requestStart,
        requestData
      );
      apiRequestsTotalCounter.add(1, requestData);
    }
  }
);
