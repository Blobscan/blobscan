import { beforeAll, describe, expect, it } from "vitest";

import { fixtures } from "@blobscan/test";

import { appRouter } from "../src/app-router";
import { createTestContext, unauthorizedRPCCallTest } from "./helpers";

describe("Blockchain sync state route", async () => {
  let nonAuthorizedCaller: ReturnType<typeof appRouter.createCaller>;
  let authorizedCaller: ReturnType<typeof appRouter.createCaller>;
  let authorizedContext: Awaited<ReturnType<typeof createTestContext>>;

  beforeAll(async () => {
    const ctx = await createTestContext();

    authorizedContext = await createTestContext({ withAuth: true });

    nonAuthorizedCaller = appRouter.createCaller(ctx);
    authorizedCaller = appRouter.createCaller(authorizedContext);
  });

  describe("getState", () => {
    it("should get blockchain sync state", async () => {
      const result = await nonAuthorizedCaller.syncState.getState();
      const expectedState: Awaited<
        ReturnType<typeof nonAuthorizedCaller.syncState.getState>
      > = {
        lastAggregatedBlock: 1004,
        lastFinalizedBlock: 1007,
        lastLowerSyncedSlot: 106,
        lastUpperSyncedSlot: 107,
      };
      expect(result).toMatchObject(expectedState);
    });
  });

  describe("updateState", () => {
    describe("when authorized", () => {
      it("should update blockchain sync state", async () => {
        const { id: _, ...expectedState } =
          fixtures.blockchainSyncState[0] || {};

        await authorizedCaller.syncState.updateState(expectedState);

        const state =
          await authorizedContext.prisma.blockchainSyncState.findFirst();

        expect(state).toMatchObject(expectedState);
      });

      it("should fail when trying to update last lower synced slot to a value greater than last upper synced slot", async () => {
        const newState = {
          lastLowerSyncedSlot: 1001,
          lastUpperSyncedSlot: 1000,
        };

        await expect(
          authorizedCaller.syncState.updateState(newState)
        ).rejects.toThrowErrorMatchingInlineSnapshot(
          '"Last lower synced slot must be less than or equal to last upper synced slot"'
        );
      });
    });

    unauthorizedRPCCallTest(() =>
      nonAuthorizedCaller.syncState.updateState({
        lastLowerSyncedSlot: 1001,
      })
    );
  });
});
