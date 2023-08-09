import { api, SemanticAttributes } from "@blobscan/open-telemetry";

export const tracer = api.trace.getTracer("@blobscan/db");

export function curryPrismaExtensionFnSpan(extensionName: string) {
  return function (modelName: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function <F extends () => any>(fnName: string, fn: F) {
      return tracer.startActiveSpan<(span: api.Span) => ReturnType<F>>(
        "prisma:extension",
        {
          attributes: {
            [SemanticAttributes.CODE_FUNCTION]: fnName,
            extension: extensionName,
            model: modelName,
          },
        },
        // An ugly workaround to enforce the exact type of the return value of the function.
        // This is specially important for Prisma operations as they need to return
        // a `PrismaPromise` type in order to include them within a transaction.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        async (span) => {
          const result = await fn();

          span.end();

          return result;
        }
      );
    };
  };
}
