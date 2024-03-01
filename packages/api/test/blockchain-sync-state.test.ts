import { beforeAll, describe, expect, it } from "vitest";

import { BlockchainSyncState } from "@blobscan/db";
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
      describe("when updating blockchain sync state", () => {
        it("should update the last finalized block correctly", async () => {
          const prevBlockchainSyncState =
            await authorizedContext.prisma.blockchainSyncState.findUnique({
              where: {
                id: 1,
              },
            });
          const newLastFinalizedBlock = 2000;

          await authorizedCaller.syncState.updateState({
            lastFinalizedBlock: newLastFinalizedBlock,
          });

          const afterBlockchainSyncState =
            await authorizedContext.prisma.blockchainSyncState.findUnique({
              where: {
                id: 1,
              },
            });

          expect(afterBlockchainSyncState).toMatchObject({
            ...prevBlockchainSyncState,
            lastFinalizedBlock: newLastFinalizedBlock,
          });
        });

        it("should update the last lower synced slot correctly", async () => {
          const prevBlockchainSyncState =
            await authorizedContext.prisma.blockchainSyncState.findUnique({
              where: {
                id: 1,
              },
            });
          const newLastLowerSyncedSlot = 2000;

          await authorizedCaller.syncState.updateState({
            lastLowerSyncedSlot: newLastLowerSyncedSlot,
          });

          const afterBlockchainSyncState =
            await authorizedContext.prisma.blockchainSyncState.findUnique({
              where: {
                id: 1,
              },
            });

          expect(afterBlockchainSyncState).toMatchObject({
            ...prevBlockchainSyncState,
            lastLowerSyncedSlot: newLastLowerSyncedSlot,
          });
        });

        it("should update the last upper synced slot correctly", async () => {
          const prevBlockchainSyncState =
            await authorizedContext.prisma.blockchainSyncState.findUnique({
              where: {
                id: 1,
              },
            });
          const newLastUpperSyncedSlot = 2000;

          await authorizedCaller.syncState.updateState({
            lastUpperSyncedSlot: newLastUpperSyncedSlot,
          });

          const afterBlockchainSyncState =
            await authorizedContext.prisma.blockchainSyncState.findUnique({
              where: {
                id: 1,
              },
            });

          expect(afterBlockchainSyncState).toMatchObject({
            ...prevBlockchainSyncState,
            lastUpperSyncedSlot: newLastUpperSyncedSlot,
          });
        });

        it("should update all fields correctly", async () => {
          const prevBlockchainSyncState =
            await authorizedContext.prisma.blockchainSyncState.findUnique({
              where: {
                id: 1,
              },
            });
          const newBlockchainSyncState = {
            lastFinalizedBlock: 2001,
            lastLowerSyncedSlot: 30,
            lastUpperSyncedSlot: 560,
          };

          await authorizedCaller.syncState.updateState(newBlockchainSyncState);

          const afterBlockchainSyncState =
            await authorizedContext.prisma.blockchainSyncState.findUnique({
              where: {
                id: 1,
              },
            });

          expect(afterBlockchainSyncState).toMatchObject(
            newBlockchainSyncState
          );
        });
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
