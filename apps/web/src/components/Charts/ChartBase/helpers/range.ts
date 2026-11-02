import type { TimeseriesMetric } from "~/types";

/**
 * A range series is one of the two series that draw a band between two
 * metrics (see TimeseriesChartBase). It is not a value of its own. Thus, the
 * legend, the tooltip and the current period do not include it.
 *
 * The ID of a range series holds the two metrics of the band. The chart uses
 * them to hide the band when the legend hides one of the metrics.
 */
const RANGE_SERIES_ID_PREFIX = "range__";
const RANGE_SERIES_ID_SEPARATOR = "__";

export type RangeBounds = {
  lower: TimeseriesMetric;
  upper: TimeseriesMetric;
};

export type RangeSeriesPart = "base" | "band";

/**
 * Returns the name that the two series of one band share. One legend action
 * on this name shows or hides the full band.
 */
export function getRangeSeriesName(
  { lower, upper }: RangeBounds,
  datasetIndex: number
) {
  return [`${RANGE_SERIES_ID_PREFIX}${lower}`, upper, datasetIndex].join(
    RANGE_SERIES_ID_SEPARATOR
  );
}

export function getRangeSeriesId(
  bounds: RangeBounds,
  datasetIndex: number,
  part: RangeSeriesPart
) {
  return `${getRangeSeriesName(
    bounds,
    datasetIndex
  )}${RANGE_SERIES_ID_SEPARATOR}${part}`;
}

export function isRangeSeriesId(seriesId: unknown): seriesId is string {
  return (
    typeof seriesId === "string" && seriesId.startsWith(RANGE_SERIES_ID_PREFIX)
  );
}

export function isRangeSeries(series: object | undefined) {
  return isRangeSeriesId((series as { id?: unknown } | undefined)?.id);
}

export function getRangeSeriesBounds(seriesId: string): RangeBounds {
  const [lower, upper] = seriesId
    .slice(RANGE_SERIES_ID_PREFIX.length)
    .split(RANGE_SERIES_ID_SEPARATOR);

  return {
    lower: lower as TimeseriesMetric,
    upper: upper as TimeseriesMetric,
  };
}
