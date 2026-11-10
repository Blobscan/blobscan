import type { ReactNode } from "react";

import type { AppRouterOutputs } from "@blobscan/api";

import type { FeeUnit } from "~/components/Toggles";

export type AddressOverall = AppRouterOutputs["address"]["getOverall"]["data"];
export type AddressTimeseries =
  AppRouterOutputs["address"]["getTimeseries"]["data"];
export type RoleTotals = AddressOverall["sent"];

export type AddressRole = "sent" | "received";

/** The props that the Analytics tab gives to each of its sections. */
export type AnalyticsSectionProps = {
  address: string;
  /** The totals of the selected time frame. */
  overall?: AddressOverall;
  /** The totals of all the time. Some cards do not use the time frame. */
  allTimeOverall?: AddressOverall;
  timeseries?: AddressTimeseries;
  isTimeseriesLoading: boolean;
  /** The roles that the page shows. */
  roles: AddressRole[];
  /** The role with more transactions. */
  mainRole?: AddressRole;
  /** True when the network has an ETH price. */
  showUsd: boolean;
  unit: FeeUnit;
  onUnitChange: (unit: FeeUnit) => void;
  /** The time frame control. A section can add its own controls after it. */
  timeFrameControl: ReactNode;
  /** True when the queries can run. */
  enabled: boolean;
};
