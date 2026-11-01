/**
 * A range series is one of the two series that draw a band between two
 * metrics (see TimeseriesChartBase). It is not a value of its own. Thus, the
 * legend, the tooltip and the current period do not include it.
 */
export const RANGE_SERIES_FLAG = "isRangeSeries";

export function isRangeSeries(series: unknown) {
  return (
    !!series &&
    typeof series === "object" &&
    (series as Record<string, unknown>)[RANGE_SERIES_FLAG] === true
  );
}
