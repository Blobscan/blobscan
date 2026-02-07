import type { EChartOption } from "echarts";

export function getDataPointsSize(
  datasetOrDatasets: EChartOption.Dataset[] | EChartOption.Dataset
): number {
  if (!Array.isArray(datasetOrDatasets)) {
    if (Array.isArray(datasetOrDatasets.source)) {
      return datasetOrDatasets.source.reduce((acc, row) => acc + row.length, 0);
    }

    if (datasetOrDatasets.source instanceof Object) {
      return Object.values(datasetOrDatasets.source).reduce(
        (acc, row) => acc + row.length,
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
