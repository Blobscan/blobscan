import type { FC } from "react";
import { useMemo } from "react";

import {
  DEFAULT_CHART_TIME_FRAME,
  getTimeFrameOption,
  TimeFrameSelector,
} from "~/components/Selectors";
import { FeeUnitToggle } from "~/components/Toggles";
import type { FeeUnit } from "~/components/Toggles";
import { api } from "~/api-client";
import { useIsTestnet } from "~/hooks/useIsTestnet";
import { useUrlState } from "~/hooks/useUrlState";
import { feeUnitParamsSchema } from "~/schemas/feeUnit";
import { timeFrameParamSchema } from "~/schemas/filters";
import { AddressCharts } from "./AddressCharts";
import { AddressMetricCard } from "./AddressMetricCard";
import type { AddressMetricCardProps } from "./AddressMetricCard";
import {
  formatByteAmount,
  formatCount,
  formatDuration,
  formatFee,
  formatPercentage,
} from "./format";
import type { AddressOverall, AddressRole, RoleTotals } from "./helpers";
import {
  getCadence,
  getDerivedMetrics,
  getMainRole,
  getNetworkShare,
  getShownRoles,
  getTimingRatio,
  ROLE_LABELS,
} from "./helpers";

const controlParamsSchema = timeFrameParamSchema.merge(feeUnitParamsSchema);

// A ratio this near to 1 is the same price as the network.
const TIMING_RATIO_TOLERANCE = 0.01;

function getTimingRatioText(ratio: number | undefined) {
  if (ratio === undefined) {
    return "No network data";
  }

  if (Math.abs(ratio - 1) < TIMING_RATIO_TOLERANCE) {
    return "Pays the network average per blob gas";
  }

  return ratio < 1
    ? "▼ Pays less per blob gas than the network average"
    : "▲ Pays more per blob gas than the network average";
}

/**
 * Returns the difference to the cost of the same data as calldata. The
 * difference is negative when calldata costs less.
 */
function getCalldataText(
  unit: FeeUnit,
  savings: bigint,
  savingsUsd: number | undefined
) {
  const isNegative =
    unit === "usd" ? (savingsUsd ?? 0) < 0 : savings < BigInt(0);
  const amount = formatFee(
    unit,
    isNegative ? -savings : savings,
    savingsUsd !== undefined ? Math.abs(savingsUsd) : undefined
  );

  if (!amount) {
    return undefined;
  }

  return isNegative
    ? `${amount} more than calldata`
    : `${amount} less than calldata`;
}

function buildCards(
  data: AddressOverall,
  roles: AddressRole[],
  unit: FeeUnit
): AddressMetricCardProps[] {
  const { main, other } = getMainRole(roles, data);
  const m = data[main];
  const o = other ? data[other] : undefined;
  const dm = getDerivedMetrics(m);
  const dOther = o ? getDerivedMetrics(o) : undefined;
  const otherRole = (format: (t: RoleTotals) => string | undefined) =>
    other && o
      ? { label: ROLE_LABELS[other], value: format(o) ?? "–" }
      : undefined;
  const cadence = getCadence(
    m.totalTransactions,
    m.firstBlockTimestamp,
    m.lastBlockTimestamp
  );
  const timingRatio = data.sent.totalTransactions
    ? getTimingRatio(data.sent, data.network)
    : undefined;
  const roleSuffix = other ? ` · ${ROLE_LABELS[main]}` : "";

  const cards: AddressMetricCardProps[] = [
    {
      name: `Total Blob Txs${roleSuffix}`,
      value: formatCount(m.totalTransactions),
      detail:
        cadence !== undefined
          ? `One tx every ${formatDuration(cadence)}`
          : undefined,
      otherRole: otherRole((t) => formatCount(t.totalTransactions)),
    },
    {
      name: "Total Blobs",
      value: formatCount(m.totalBlobs),
      detail:
        dm.avgBlobsPerTx !== undefined
          ? `${formatCount(
              Math.round(dm.avgBlobsPerTx * 100) / 100
            )} blobs per tx`
          : undefined,
      otherRole: otherRole((t) => formatCount(t.totalBlobs)),
    },
    {
      name: "Total Blob Fees",
      value: formatFee(unit, BigInt(m.totalBlobBaseFee), m.totalBlobBaseFeeUsd),
      detail: getCalldataText(unit, dm.calldataSavings, dm.calldataSavingsUsd),
      otherRole: otherRole((t) =>
        formatFee(unit, BigInt(t.totalBlobBaseFee), t.totalBlobBaseFeeUsd)
      ),
    },
    {
      name: "Avg Fee per Tx",
      value: formatFee(unit, dm.avgFeePerTx, dm.avgFeePerTxUsd),
      detail: "Blob base fee ÷ txs",
      otherRole: dOther
        ? otherRole(() =>
            formatFee(unit, dOther.avgFeePerTx, dOther.avgFeePerTxUsd)
          )
        : undefined,
    },
    {
      name: "Cost per KiB of Data",
      value: formatFee(unit, dm.costPerKb, dm.costPerKbUsd),
      detail: "Blob fee ÷ bytes with data",
      otherRole: dOther
        ? otherRole(() =>
            formatFee(unit, dOther.costPerKb, dOther.costPerKbUsd)
          )
        : undefined,
    },
    {
      name: "Blob Utilization",
      value: formatPercentage(dm.utilization, 1),
      detail: dm.blobSize
        ? `${formatByteAmount(dm.wastedSize)} padding · ${
            formatFee(unit, dm.wastedFee, dm.wastedFeeUsd) ?? "–"
          }`
        : undefined,
      otherRole: dOther
        ? otherRole(() => formatPercentage(dOther.utilization, 1))
        : undefined,
    },
    {
      name: "Share of Network Blobs",
      value: formatPercentage(
        getNetworkShare(m.totalBlobs, data.network.totalBlobs)
      ),
      detail: `Of ${formatCount(data.network.totalBlobs)} blobs`,
      otherRole: otherRole((t) =>
        formatPercentage(getNetworkShare(t.totalBlobs, data.network.totalBlobs))
      ),
    },
    data.sent.totalTransactions
      ? {
          name: "Timing Ratio · Sent",
          value:
            timingRatio !== undefined
              ? `${timingRatio.toFixed(2)}×`
              : undefined,
          detail: getTimingRatioText(timingRatio),
        }
      : {
          name: "Calldata Savings",
          value: formatFee(unit, dm.calldataSavings, dm.calldataSavingsUsd),
          detail: "Calldata fee − blob fee",
        },
  ];

  return cards;
}

export type AddressAnalyticsProps = {
  address: string;
};

export const AddressAnalytics: FC<AddressAnalyticsProps> = function ({
  address,
}) {
  const { state, updateState, isReady } = useUrlState(controlParamsSchema);
  const isTestnet = useIsTestnet();
  const showUsd = isTestnet === false;
  const timeFrame = state?.timeFrame ?? DEFAULT_CHART_TIME_FRAME;
  const unit: FeeUnit = showUsd ? state?.unit ?? "eth" : "eth";
  const queryOpts = {
    enabled: isReady && !!address,
    refetchOnWindowFocus: false,
  };

  const overall = api.address.getOverall.useQuery(
    { address, timeFrame },
    queryOpts
  );
  const timeseries = api.address.getTimeseries.useQuery(
    { address, timeFrame },
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
  const cards = data ? buildCards(data, roles, unit) : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-24">
            <TimeFrameSelector
              selected={getTimeFrameOption(timeFrame)}
              onChange={({ value }) => updateState({ timeFrame: value })}
            />
          </div>
          <div className="flex gap-3 text-sm text-contentSecondary-light dark:text-contentSecondary-dark">
            {roles.map((role) => (
              <span key={role} className="flex items-center gap-1.5">
                <span
                  className={
                    role === "sent"
                      ? "h-2.5 w-2.5 rounded-sm bg-primary-700 dark:bg-primary-500"
                      : "h-2.5 w-2.5 rounded-sm bg-blues-200"
                  }
                />
                {ROLE_LABELS[role]}
              </span>
            ))}
          </div>
        </div>
        {showUsd && (
          <div className="w-36">
            <FeeUnitToggle
              variant="control"
              unit={unit}
              onChange={(value) =>
                updateState({ unit: value !== "eth" ? value : undefined })
              }
            />
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(cards ?? Array.from({ length: 8 }, () => undefined)).map((card, i) =>
          card ? (
            <AddressMetricCard key={card.name} {...card} />
          ) : (
            <AddressMetricCard key={i} name="" isLoading />
          )
        )}
      </div>
      <AddressCharts
        data={timeseries.data?.data}
        roles={roles}
        unit={unit}
        isLoading={timeseries.isLoading}
      />
    </div>
  );
};
