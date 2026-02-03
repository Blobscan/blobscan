import type { ReactNode } from "react";

import type { TimeFrame } from "@blobscan/api";
import type { EtherUnit } from "@blobscan/eth-format";

import type { Size, TimeseriesData } from "~/types";
import type { ByteUnit } from "~/utils";
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

export interface ChartBaseProps {
  compact?: boolean;
  headerControls?: ReactNode;
  size?: Size;
  loadingOpts?: {
    timeFrame?: TimeFrame;
    chartType?: "line" | "bar";
  };
}

export interface MultipleTimeseriesChartProps<
  T extends TimeseriesData = TimeseriesData
> extends ChartBaseProps {
  datasets?: TimeseriesDataset<T>[];
}

export interface SingleTimeseriesChartProps<
  T extends TimeseriesData = TimeseriesData
> extends ChartBaseProps {
  dataset?: TimeseriesDataset<T>;
}
