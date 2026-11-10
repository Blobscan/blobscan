import type { FC } from "react";
import { useMemo } from "react";
import {
  ArrowsRightLeftIcon,
  CalendarDaysIcon,
  CircleStackIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";

import { z } from "@blobscan/zod";

import {
  DEFAULT_CHART_TIME_FRAME,
  getTimeFrameOption,
  TimeFrameSelector,
} from "~/components/Selectors";
import { Tabs } from "~/components/Tabs";
import type { FeeUnit } from "~/components/Toggles";
import { api } from "~/api-client";
import { useIsTestnet } from "~/hooks/useIsTestnet";
import { useUrlState } from "~/hooks/useUrlState";
import BlobIcon from "~/icons/blob.svg";
import { feeUnitParamsSchema } from "~/schemas/feeUnit";
import { timeFrameParamSchema } from "~/schemas/filters";
import type { RenderableIcon } from "~/types/icons";
import type { AddressRole, AddressSection } from "../../helpers";
import {
  ADDRESS_SECTIONS,
  getMainRole,
  getShownRoles,
  SECTION_LABELS,
} from "../../helpers";
import { ActivityTab } from "./ActivityTab";
import { BlobUsageTab } from "./BlobUsageTab";
import { BlobsTab } from "./BlobsTab";
import { FeesTab } from "./FeesTab";
import { NetworkTab } from "./NetworkTab";
import { TransactionsTab } from "./TransactionsTab";
import type { AnalyticsSectionProps } from "./types";

const controlParamsSchema = timeFrameParamSchema
  .merge(feeUnitParamsSchema)
  .merge(z.object({ section: z.enum(ADDRESS_SECTIONS).optional() }));

/** The icon and the component of each section. ADDRESS_SECTIONS gives the order. */
const SECTIONS: Record<
  AddressSection,
  { icon: RenderableIcon; Component: FC<AnalyticsSectionProps> }
> = {
  activity: { icon: CalendarDaysIcon, Component: ActivityTab },
  transactions: { icon: ArrowsRightLeftIcon, Component: TransactionsTab },
  blobs: { icon: BlobIcon, Component: BlobsTab },
  usage: { icon: CircleStackIcon, Component: BlobUsageTab },
  fees: { icon: CurrencyDollarIcon, Component: FeesTab },
  network: { icon: GlobeAltIcon, Component: NetworkTab },
};

export type AddressAnalyticsTabProps = {
  address: string;
};

/**
 * The Analytics tab of the address page: one section for each group of
 * metrics. Each section has its own file with its cards and its charts.
 */
export const AddressAnalyticsTab: FC<AddressAnalyticsTabProps> = function ({
  address,
}) {
  const { state, updateState, isReady } = useUrlState(controlParamsSchema);
  const isTestnet = useIsTestnet();
  const showUsd = isTestnet === false;
  const timeFrame = state?.timeFrame ?? DEFAULT_CHART_TIME_FRAME;
  const unit: FeeUnit = showUsd ? state?.unit ?? "eth" : "eth";
  const section: AddressSection = state?.section ?? "activity";
  const enabled = isReady && !!address;
  const queryOpts = { enabled, refetchOnWindowFocus: false };

  const overall = api.address.getOverall.useQuery(
    { address, timeFrame },
    queryOpts
  );
  const timeseries = api.address.getTimeseries.useQuery(
    { address, timeFrame },
    queryOpts
  );
  // Some cards use all the time. With the "All" time frame, this is the same
  // query as the one above.
  const allTimeOverall = api.address.getOverall.useQuery(
    { address, timeFrame: "All" },
    queryOpts
  );

  const data = overall.data?.data;
  const roles = useMemo(
    () =>
      data
        ? getShownRoles({
            sentTotalTransactions: data.sent.totalTransactions,
            receivedTotalTransactions: data.received.totalTransactions,
            selfTotalTransactions: data.selfTotalTransactions,
          })
        : (["sent"] as AddressRole[]),
    [data]
  );

  const sectionProps: AnalyticsSectionProps = {
    address,
    overall: data,
    allTimeOverall: allTimeOverall.data?.data,
    timeseries: timeseries.data?.data,
    isTimeseriesLoading: timeseries.isLoading,
    roles,
    mainRole: data ? getMainRole(roles, data).main : undefined,
    showUsd,
    unit,
    onUnitChange: (value) =>
      updateState({ unit: value !== "eth" ? value : undefined }),
    timeFrameControl: (
      <div className="w-24">
        <TimeFrameSelector
          selected={getTimeFrameOption(timeFrame)}
          onChange={({ value }) => updateState({ timeFrame: value })}
        />
      </div>
    ),
    enabled,
  };

  return (
    <Tabs
      fullWidth
      selected={section}
      onChange={(value) =>
        updateState({ section: value !== "activity" ? value : undefined })
      }
      tabs={ADDRESS_SECTIONS.map((value) => {
        const { icon, Component } = SECTIONS[value];

        return {
          value,
          label: SECTION_LABELS[value],
          icon,
          content: <Component {...sectionProps} />,
        };
      })}
    />
  );
};
