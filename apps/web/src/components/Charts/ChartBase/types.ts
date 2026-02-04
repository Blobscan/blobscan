import type { FC } from "react";

import type { EtherUnit } from "@blobscan/eth-format";

import type { TimeseriesData, TimeseriesMetric } from "~/types";
import type { ByteUnit } from "~/utils";
import type { ChartBaseProps } from ".";
import type { TimeseriesDataset } from "../helpers";

export type MetricType = "count" | "average" | "time";

export type MetricUnitType = "ether" | "byte";

interface MetricInfoBase {
  type: MetricType;
  unitType?: MetricUnitType;
  unit?: EtherUnit | ByteUnit;
  displayUnit?: EtherUnit | ByteUnit;
}
export interface TimeMetricInfo extends MetricInfoBase {
  type: "time";
  unitType?: never;
  unit?: never;
  displayUnit?: never;
}

export interface UnitlessMetricInfo extends MetricInfoBase {
  type: Exclude<MetricType, "time">;
  unitType?: never;
  unit?: never;
  displayUnit?: never;
}

export interface EtherMetricInfo extends MetricInfoBase {
  type: Exclude<MetricType, "time">;
  unitType: "ether";
  unit: EtherUnit;
  displayUnit?: EtherUnit;
}

export interface ByteMetricInfo extends MetricInfoBase {
  type: Exclude<MetricType, "time">;
  unitType: "byte";
  unit: ByteUnit;
  displayUnit?: ByteUnit;
}

export type MetricInfo =
  | TimeMetricInfo
  | UnitlessMetricInfo
  | EtherMetricInfo
  | ByteMetricInfo;

export type TimeseriesChartBaseProps = Pick<
  ChartBaseProps,
  "compact" | "headerControls" | "size" | "isLoading" | "skeletonOpts"
>;

export interface MultipleTimeseriesChartProps<
  T extends TimeseriesData = TimeseriesData
> extends TimeseriesChartBaseProps {
  dataset?: TimeseriesDataset<T>[];
}

export interface SingleTimeseriesChartProps<
  T extends TimeseriesData = TimeseriesData
> extends TimeseriesChartBaseProps {
  dataset?: TimeseriesDataset<T>;
}

export type TimeseriesChartProps =
  | MultipleTimeseriesChartProps
  | SingleTimeseriesChartProps;

export type TimeseriesChartComponent<P extends TimeseriesChartProps> = FC<P> & {
  displayName?: string;
  requiredMetrics: [TimeseriesMetric, ...TimeseriesMetric[]];
};
