import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { BlobStoragesState } from "@blobscan/db";
import { prisma } from "@blobscan/db";
import { fixtures, testValidError } from "@blobscan/test";

import { syncSwarmStamp } from "../src";

const BEE_ENDPOINT = process.env.BEE_ENDPOINT ?? "http://localhost:1633";

describe("SwarmStampSyncer", () => {
  const expectedBatchId = fixtures.blobStoragesState[0]?.swarmDataId as string;
  const expectedBatchTTL = 1000;

  beforeAll(() => {
    const baseUrl = `${BEE_ENDPOINT}/stamps`;
    const server = setupServer(
      ...[
        http.get(`${baseUrl}/:batchId`, ({ request }) => {
          const batchId = request.url.split("/").pop();

          if (!batchId || batchId.length !== 64) {
            return HttpResponse.json(
              {
                code: 400,
                message: "invalid path params",
                reasons: [
                  {
                    field: "batch_id",
                    error: "odd length hex string",
                  },
                ],
              },
              { status: 400 }
            );
          }

          if (batchId !== expectedBatchId) {
            return HttpResponse.json(
              {
                code: 404,
                message: "issuer does not exist",
              },
              { status: 404 }
            );
          }

          return HttpResponse.json(
            {
              batchID: expectedBatchId,
              batchTTL: expectedBatchTTL,
            },
            {
              status: 200,
            }
          );
        }),
      ]
    );

    server.listen();

    return () => {
      server.close();
    };
  });

  describe("when creating a new swarm batch data row in the db", async () => {
    let blobStorageState: BlobStoragesState | null = null;

    beforeEach(async () => {
      await prisma.blobStoragesState.deleteMany();

      await syncSwarmStamp({
        batchId: process.env.SWARM_BATCH_ID ?? "",
        beeEndpoint: BEE_ENDPOINT,
      }).catch((err) => console.log(err));

      blobStorageState = await prisma.blobStoragesState.findFirst();
    });

    it("should create it with the correct swarm stamp batch ID", async () => {
      expect(blobStorageState?.swarmDataId).toBe(process.env.SWARM_BATCH_ID);
    });

    it("should create it with the correct batch TTL", async () => {
      expect(blobStorageState?.swarmDataTTL).toBe(expectedBatchTTL);
    });
  });

  it("should update the batch TTl", async () => {
    await prisma.blobStoragesState.update({
      data: {
        swarmDataTTL: 99999,
      },
      where: {
        id: 1,
      },
    });

    await syncSwarmStamp({
      batchId: process.env.SWARM_BATCH_ID ?? "",
      beeEndpoint: BEE_ENDPOINT,
    });

    const blobStorageState = await prisma.blobStoragesState.findFirst();

    expect(blobStorageState?.swarmDataTTL).toBe(expectedBatchTTL);
  });

  testValidError(
    "should fail when trying to fetch a non-existing batch",
    async () => {
      await syncSwarmStamp({
        beeEndpoint: BEE_ENDPOINT,
        batchId:
          "6b538866048cfb6e9e1d06805374c51572c11219d2d550c03e6e277366cb0371",
      });
    },
    Error,
    {
      checkCause: true,
    }
  );

  testValidError(
    "should fail when trying to fetch an invalid batch",
    async () => {
      await syncSwarmStamp({
        beeEndpoint: BEE_ENDPOINT,
        batchId: "invalid-batch",
      });
    },
    Error,
    {
      checkCause: true,
    }
  );
});
