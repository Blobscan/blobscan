import { api } from "@blobscan/open-telemetry";

import { meter, tracer } from "../instrumentation";
import { t } from "../trpc-client";

type APICounter = {
  scope?: string;
};

type RequestsTotalCounter = APICounter & {
  endpoint: string;
  status_code: string;
  method: string;
};

const apiRequestsTotalCounter = meter.createCounter<RequestsTotalCounter>(
  "blobscan_api_requests_total",
  {
    valueType: api.ValueType.INT,
    description:
      "Number of requests made to Blobscan API by endpoint, status_code and method",
  }
);

const apiRequestsDurationMsHistogram = meter.createHistogram<APICounter>(
  "blobscan_api_requests_duration_ms",
  {
    description: "Duration of all the requests made to Blobscan API",
    valueType: api.ValueType.INT,
    unit: "ms",
  }
);

function getEndpoint(url: string) {
  return url.split("?")[0] ?? "";
}

function getProcedureFromUrl(url: string) {
  const procedure = getEndpoint(url)
    .split("/")
    .find((_, i, urlSplitted) => {
      const prevPath = urlSplitted[i - 1];

      return prevPath === "trpc";
    });

  return procedure;
}

export const withTelemetry = t.middleware(
  async ({ ctx: { req, res, scope }, next }) => {
    const endpoint = req?.url ? getEndpoint(req.url) : "unknown-endpoint";
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

      apiRequestsDurationMsHistogram.record(requestEnd - requestStart, {
        scope,
      });
      apiRequestsTotalCounter.add(1, {
        scope,
        status_code: res.statusCode.toString(),
        endpoint,
        method: req?.method ?? "unknown-method",
      });
    }
  }
);
