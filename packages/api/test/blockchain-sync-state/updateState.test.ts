import { TRPCError } from "@trpc/server";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { BlockchainSyncState } from "@blobscan/db";
import { testValidError } from "@blobscan/test";

import type { TRPCContext } from "../../src";
import { createTestContext, unauthorizedRPCCallTest } from "../helpers";
import { createBlockchainSyncStateCaller } from "./caller";
import type { BlockchainSyncStateCaller } from "./caller";

describe("updateState", () => {
  let nonAuthorizedCaller: BlockchainSyncStateCaller;
  let authorizedCaller: BlockchainSyncStateCaller;
  let authorizedContext: TRPCContext;

  beforeAll(async () => {
    const ctx = await createTestContext();

    authorizedContext = await createTestContext({
      apiClient: "indexer",
    });

    nonAuthorizedCaller = createBlockchainSyncStateCaller(ctx);
    authorizedCaller = createBlockchainSyncStateCaller(authorizedContext);
  });

  describe("when authorized", () => {
    describe("when updating blockchain sync state", () => {
      let prevBlockchainSyncState: BlockchainSyncState;

      beforeEach(async () => {
        const state =
          await authorizedContext.prisma.blockchainSyncState.findFirst();

        if (!state) {
          throw new Error("Blockchain sync state should exist");
        }

        prevBlockchainSyncState = state;
      });

      it("should update the last finalized block correctly", async () => {
        const newLastFinalizedBlock = 2000;

        await authorizedCaller.updateState({
          lastFinalizedBlock: newLastFinalizedBlock,
        });

        const afterBlockchainSyncState =
          await authorizedContext.prisma.blockchainSyncState.findFirst();

        expect(afterBlockchainSyncState).toMatchObject({
          ...prevBlockchainSyncState,
          lastFinalizedBlock: newLastFinalizedBlock,
        });
      });

      it("should update the last lower synced slot correctly", async () => {
        const newLastLowerSyncedSlot = 2000;

        await authorizedCaller.updateState({
          lastLowerSyncedSlot: newLastLowerSyncedSlot,
        });

        const afterBlockchainSyncState =
          await authorizedContext.prisma.blockchainSyncState.findFirst();

        expect(afterBlockchainSyncState).toMatchObject({
          ...prevBlockchainSyncState,
          lastLowerSyncedSlot: newLastLowerSyncedSlot,
        });
      });

      it("should update the last upper synced slot correctly", async () => {
        const newLastUpperSyncedSlot = 2000;

        await authorizedCaller.updateState({
          lastUpperSyncedSlot: newLastUpperSyncedSlot,
        });

        const afterBlockchainSyncState =
          await authorizedContext.prisma.blockchainSyncState.findFirst();

        expect(afterBlockchainSyncState).toMatchObject({
          ...prevBlockchainSyncState,
          lastUpperSyncedSlot: newLastUpperSyncedSlot,
        });
      });

      it("should update the last upper synced block root correctly", async () => {
        const newLastUpperSyncedBlockRoot = "0x".padEnd(66, "1");

        await authorizedCaller.updateState({
          lastUpperSyncedBlockRoot: newLastUpperSyncedBlockRoot,
        });

        const afterBlockchainSyncState =
          await authorizedContext.prisma.blockchainSyncState.findFirst();

        expect(afterBlockchainSyncState).toMatchObject({
          ...prevBlockchainSyncState,
          lastUpperSyncedBlockRoot: newLastUpperSyncedBlockRoot,
        });
      });

      it("should update the last upper synced block slot correctly", async () => {
        const newLastUpperSyncedBlockSlot = 2000;

        await authorizedCaller.updateState({
          lastUpperSyncedBlockSlot: newLastUpperSyncedBlockSlot,
        });

        const afterBlockchainSyncState =
          await authorizedContext.prisma.blockchainSyncState.findFirst();

        expect(afterBlockchainSyncState).toMatchObject({
          ...prevBlockchainSyncState,
          lastUpperSyncedBlockSlot: newLastUpperSyncedBlockSlot,
        });
      });

      it("should update all fields correctly", async () => {
        const newBlockchainSyncState = {
          lastFinalizedBlock: 2001,
          lastLowerSyncedSlot: 30,
          lastUpperSyncedSlot: 560,
          lastUpperSyncedBlockRoot: "0x".padEnd(66, "1"),
          lastUpperSyncedBlockSlot: 2000,
        };

        await authorizedCaller.updateState(newBlockchainSyncState);

        const afterBlockchainSyncState =
          await await authorizedContext.prisma.blockchainSyncState.findFirst();

        expect(afterBlockchainSyncState).toMatchObject(newBlockchainSyncState);
      });
    });

    testValidError(
      "should fail when trying to update last finalized slot to an invalid slot",
      async () => {
        await authorizedCaller.updateState({
          lastFinalizedBlock: -1,
        });
      },
      TRPCError,
      {
        checkCause: true,
      }
    );

    testValidError(
      "should fail when trying to update last lower synced slot to an invalid slot",
      async () => {
        await authorizedCaller.updateState({
          lastLowerSyncedSlot: -1,
        });
      },
      TRPCError,
      {
        checkCause: true,
      }
    );

    testValidError(
      "should fail when trying to update last upper synced slot to an invalid slot",
      async () => {
        await authorizedCaller.updateState({
          lastUpperSyncedSlot: -1,
        });
      },
      TRPCError,
      {
        checkCause: true,
      }
    );

    testValidError(
      "should fail when trying to update last upper synced block root to an invalid hash",
      async () => {
        await authorizedCaller.updateState({
          lastUpperSyncedBlockRoot: "invalid hash",
        });
      },
      TRPCError,
      {
        checkCause: true,
      }
    );

    testValidError(
      "should fail when trying to update last upper synced block slot to an invalid slot",
      async () => {
        await authorizedCaller.updateState({
          lastUpperSyncedBlockSlot: -1,
        });
      },
      TRPCError,
      {
        checkCause: true,
      }
    );

    it("should fail when trying to update last lower synced slot to a value greater than last upper synced slot", async () => {
      const newState = {
        lastLowerSyncedSlot: 1001,
        lastUpperSyncedSlot: 1000,
      };

      await expect(
        authorizedCaller.updateState(newState)
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        '"Last lower synced slot must be less than or equal to last upper synced slot"'
      );
    });
  });

  unauthorizedRPCCallTest(() =>
    nonAuthorizedCaller.updateState({
      lastLowerSyncedSlot: 1001,
    })
  );
});
