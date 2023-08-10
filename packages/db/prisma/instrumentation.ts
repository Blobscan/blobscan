import { api, SemanticAttributes } from "@blobscan/open-telemetry";

export const tracer = api.trace.getTracer("@blobscan/db");

export function curryPrismaExtensionFnSpan(extensionName: string) {
  return function (modelName: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function <F extends () => any>(fnName: string, fn: F) {
      return tracer.startActiveSpan<
        (span: api.Span) => Promise<Awaited<ReturnType<F>>>
      >(
        "prisma:extension",
        {
          attributes: {
            [SemanticAttributes.CODE_FUNCTION]: fnName,
            extension: extensionName,
            model: modelName,
          },
        },
        async (span) => {
          const result = await fn();

          span.end();

          return result;
        }
      );
    };
  };
}
