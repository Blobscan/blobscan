import type { BlobStorage } from "@blobscan/db/prisma/enums";
import { api } from "@blobscan/open-telemetry";

const scopeName = "blobscan_blob_storage_manager";

export const tracer = api.trace.getTracer(scopeName);
export const meter = api.metrics.getMeter(scopeName);

type Direction = "sent" | "received";

export type StorageMetricBaseAttributes = {
  storage: BlobStorage;
  direction: Direction;
};

const bytesTransferredTotalCounter =
  meter.createCounter<StorageMetricBaseAttributes>(
    "blobscan_storage_bytes_transferred_total",
    {
      description: "Number of bytes transferred to/from a blob storage",
      valueType: api.ValueType.INT,
      unit: "bytes",
    }
  );

const filesTransferredTotalCounter =
  meter.createCounter<StorageMetricBaseAttributes>(
    "blobscan_storage_files_transferred_total",
    {
      description: "Number of files transferred to/from a blob storage",
      valueType: api.ValueType.INT,
      unit: "files",
    }
  );

const transferDurationHistogram =
  meter.createHistogram<StorageMetricBaseAttributes>(
    "blobscan_storage_transfer_duration_seconds",
    {
      description: "Duration of the transfers to/from a blob storage",
      valueType: api.ValueType.INT,
      unit: "ms",
    }
  );

export type IpfsGatewayOutcome =
  | "success"
  | "retry"
  | "gateway_error"
  | "too_large"
  | "integrity_failure"
  | "network_error";

export type IpfsGatewayMetricAttributes = {
  outcome: IpfsGatewayOutcome;
  // HTTP status when available; 0 for network/timeout errors.
  status: number;
};

const ipfsGatewayRequestsTotalCounter =
  meter.createCounter<IpfsGatewayMetricAttributes>(
    "blobscan_ipfs_gateway_requests_total",
    {
      description:
        "Number of requests issued to the IPFS gateway, labelled by outcome and HTTP status",
      valueType: api.ValueType.INT,
    }
  );

const ipfsGatewayRequestDurationHistogram =
  meter.createHistogram<IpfsGatewayMetricAttributes>(
    "blobscan_ipfs_gateway_request_duration_ms",
    {
      description:
        "Duration of individual IPFS gateway requests (per attempt, not per getBlob call)",
      valueType: api.ValueType.INT,
      unit: "ms",
    }
  );

export function recordIpfsGatewayAttempt({
  outcome,
  status,
  durationMs,
}: {
  outcome: IpfsGatewayOutcome;
  status: number;
  durationMs: number;
}) {
  const attrs: IpfsGatewayMetricAttributes = { outcome, status };
  ipfsGatewayRequestsTotalCounter.add(1, attrs);
  ipfsGatewayRequestDurationHistogram.record(durationMs, attrs);
}

export function updateBlobStorageMetrics({
  storage,
  blobSize,
  direction,
  duration,
}: {
  storage: BlobStorage;
  blobSize: number;
  direction: Direction;
  duration: number;
}) {
  const counterAttributes: StorageMetricBaseAttributes = {
    storage,
    direction,
  };

  bytesTransferredTotalCounter.add(blobSize, counterAttributes);
  filesTransferredTotalCounter.add(1, {
    direction,
    storage,
  });
  transferDurationHistogram.record(duration, counterAttributes);
}
