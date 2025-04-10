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

export type TimeSeriesBaseProps<T> = Partial<{
  compact: boolean;
  size: "sm" | "md" | "lg";
  days: string[];
  series: T;
}>;
