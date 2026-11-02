import type { EtherUnit } from "@blobscan/eth-format";

import type { ByteUnit } from "~/utils";

export type AxisType = "count" | "average" | "time";

export type AxisUnitType = "ether" | "byte" | "fiat";

export type FiatUnit = "USD";

interface AxisBase {
  type: AxisType;
  unitType?: AxisUnitType;
  unit?: EtherUnit | ByteUnit | FiatUnit;
  displayUnit?: EtherUnit | ByteUnit | FiatUnit;
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

export interface FiatAxis extends AxisBase {
  type: Exclude<AxisType, "time">;
  unitType: "fiat";
  unit: FiatUnit;
  displayUnit?: never;
}

export type Axis = TimeAxis | UnitlessAxis | EtherAxis | BytesAxis | FiatAxis;

export type Axes = {
  x: Axis;
  y: Axis;
};

export type StandardEncoding = {
  x: number[];
  y: number[];
};
