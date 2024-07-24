import { TRPCError } from "@trpc/server";
import { describe } from "vitest";

import { testValidError } from "@blobscan/test";

export function blobIdSchemaTestsSuite(
  fetcher: (invalidBlobId: string) => Promise<unknown>
) {
  return describe("when providing an invalid blob id", () => {
    testValidError(
      "should fail when providing a non-hex string",
      async () => {
        await fetcher("nonHexString");
      },
      TRPCError
    );

    testValidError(
      "should fail when providing a hex string with invalid length",
      async () => {
        await fetcher("0x123");
      },
      TRPCError
    );

    testValidError(
      "should fail when providing a versioned hash with invalid prefix",
      async () => {
        await fetcher(
          "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
        );
      },
      TRPCError
    );
  });
}
