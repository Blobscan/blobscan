import type { EtherUnit } from "@blobscan/eth-format";

import type { ByteUnit } from "~/utils";

export type AxisType = "count" | "average" | "time";

export type AxisUnitType = "ether" | "byte";

interface AxisBase {
  type: AxisType;
  unitType?: AxisUnitType;
  unit?: EtherUnit | ByteUnit;
  displayUnit?: EtherUnit | ByteUnit;
}
export interface TimeAxis extends AxisBase {
  type: "time";
  unitType?: never;
  unit?: never;
  displayUnit?: never;
}

export interface UnitlessAxis extends AxisBase {
  type: Exclude<AxisType, "time">;
  unitType?: never;
  unit?: never;
  displayUnit?: never;
}

export interface EtherAxis extends AxisBase {
  type: Exclude<AxisType, "time">;
  unitType: "ether";
  unit: EtherUnit;
  displayUnit?: EtherUnit;
}

export interface BytesAxis extends AxisBase {
  type: Exclude<AxisType, "time">;
  unitType: "byte";
  unit: ByteUnit;
  displayUnit?: ByteUnit;
}

export type Axis = TimeAxis | UnitlessAxis | EtherAxis | BytesAxis;

export type Axes = {
  x: Axis;
  y: Axis;
};

export type StandardEncoding = {
  x: number[];
  y: number[];
};
