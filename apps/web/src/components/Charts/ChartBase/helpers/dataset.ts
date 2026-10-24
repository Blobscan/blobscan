import type { DatasetComponentOption } from "echarts";

function getRowSize(row: unknown): number {
  if (Array.isArray(row)) {
    return row.length;
  }

  if (ArrayBuffer.isView(row)) {
    return (row as unknown as ArrayLike<unknown>).length ?? row.byteLength;
  }

  if (row && typeof row === "object") {
    return Object.keys(row).length;
  }

  return 0;
}

export function getDataPointsSize(
  datasetOrDatasets: DatasetComponentOption[] | DatasetComponentOption
): number {
  if (!Array.isArray(datasetOrDatasets)) {
    const { source } = datasetOrDatasets;

    if (Array.isArray(source)) {
      return source.reduce<number>((acc, row) => acc + getRowSize(row), 0);
    }

    if (ArrayBuffer.isView(source)) {
      return (
        (source as unknown as ArrayLike<unknown>).length ?? source.byteLength
      );
    }

    if (source && typeof source === "object") {
      return Object.values(source).reduce<number>(
        (acc, column) => acc + getRowSize(column),
        0
      );
    }

    return 0;
  }

  return datasetOrDatasets.reduce(
    (acc, dataset) => acc + getDataPointsSize(dataset),
    0
  );
}
