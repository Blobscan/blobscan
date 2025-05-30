import type { EtherUnit } from "@blobscan/eth-format";

import type { BYTE_UNITS } from "~/utils";

export type MetricType = "count" | "average" | "time";

export type MetricUnitType = "ether" | "byte" | "none";

interface BaseMetricInfo {
  type: MetricType;
  unitType?: MetricUnitType;
}
interface TimeMetricInfo extends BaseMetricInfo {
  type: "time";
}

interface UnitlessMetricInfo extends BaseMetricInfo {
  type: Exclude<MetricType, "time">;
  unitType: "none";
}

interface EtherMetricInfo extends BaseMetricInfo {
  type: Exclude<MetricType, "time">;
  unitType: "ether";
  unit: EtherUnit;
}

interface ByteMetricInfo extends BaseMetricInfo {
  type: Exclude<MetricType, "time">;
  unitType: "byte";
  unit: (typeof BYTE_UNITS)[number];
}

export type MetricInfo =
  | TimeMetricInfo
  | UnitlessMetricInfo
  | EtherMetricInfo
  | ByteMetricInfo;

export interface AxisMetricInfo {
  xAxis: MetricInfo;
  yAxis: MetricInfo;
}

export interface ChartCommonProps {
  compact?: boolean;
  showLegend?: boolean;
  size?: "sm" | "md" | "lg";
}

interface TimeSeriesBaseProps extends ChartCommonProps {
  days?: string[];
}

export interface TimeSeriesProps<T extends number | string>
  extends TimeSeriesBaseProps {
  series?: {
    name?: string;
    values: T[];
  }[];
}

export interface CustomTimeSeriesProps<T> extends TimeSeriesBaseProps {
  series?: T;
}
