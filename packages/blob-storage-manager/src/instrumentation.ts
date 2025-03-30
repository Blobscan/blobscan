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
