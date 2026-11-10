import type { FC } from "react";
import { useMemo } from "react";

import type { MetricCardProps } from "~/components/Cards/MetricCard";
import { FeeUnitToggle } from "~/components/Toggles";
import type { FeeUnit } from "~/components/Toggles";
import { getDerivedMetrics } from "../../helpers";
import { SectionLayout } from "./SectionLayout";
import { feeMetric, skeletonCards } from "./cards";
import type { ChartSpec } from "./charts";
import { getFeeAxes, roleBars, roleLines } from "./charts";
import type { AnalyticsSectionProps } from "./types";

/** The names of the cards. They are also the skeletons while the data loads. */
export const FEES_CARD_NAMES = [
  "Total Blob Fees",
  "Avg. Blob Fee per Tx",
  "Cost per KiB of Blob Data",
  "Calldata Savings",
  "Wasted Blob Fees",
];

function buildCards({
  overall,
  mainRole = "sent",
  showUsd,
}: AnalyticsSectionProps): MetricCardProps[] {
  if (!overall) {
    return skeletonCards(FEES_CARD_NAMES);
  }

  const totals = overall[mainRole];
  const dm = getDerivedMetrics(totals);

  return [
    {
      name: "Total Blob Fees",
      ...feeMetric(
        showUsd,
        BigInt(totals.totalBlobBaseFee),
        totals.totalBlobBaseFeeUsd
      ),
    },
    {
      name: "Avg. Blob Fee per Tx",
      ...feeMetric(showUsd, dm.avgFeePerTx, dm.avgFeePerTxUsd),
    },
    {
      name: "Cost per KiB of Blob Data",
      ...feeMetric(showUsd, dm.costPerKb, dm.costPerKbUsd),
    },
    {
      name: "Calldata Savings",
      ...feeMetric(showUsd, dm.calldataSavings, dm.calldataSavingsUsd),
    },
    {
      name: "Wasted Blob Fees",
      ...feeMetric(showUsd, dm.unusedFee, dm.unusedFeeUsd),
    },
  ];
}

function getCharts(unit: FeeUnit): ChartSpec[] {
  const isUsd = unit === "usd";
  const axes = getFeeAxes(unit);

  return [
    {
      title: "Blob Fees",
      description:
        "Blob base fees of the transactions in each period, by role. The blob base fee is the blob gas used multiplied by the blob gas price of the block.",
      yAxis: axes.total,
      series: roleBars(isUsd ? "FeeUsd" : "Fee"),
      tooltipOpts: { displayTotal: true, totalLabel: "Total Blob Fees" },
    },
    {
      title: "Cost per KiB of Blob Data",
      description:
        "Blob fees divided by the size of the blob data in each period, by role. Unused blob space makes this cost higher.",
      yAxis: axes.average,
      series: roleLines(isUsd ? "CostPerKbUsd" : "CostPerKb"),
    },
  ];
}

export const FeesTab: FC<AnalyticsSectionProps> = function (props) {
  const { showUsd, unit, onUnitChange, timeFrameControl } = props;
  const charts = useMemo(() => getCharts(unit), [unit]);

  return (
    <SectionLayout
      {...props}
      cards={buildCards(props)}
      charts={charts}
      controls={
        <>
          {timeFrameControl}
          {/* The unit toggle shows only when the network has an ETH price. */}
          {showUsd && (
            <div className="w-36">
              <FeeUnitToggle
                variant="control"
                unit={unit}
                onChange={onUnitChange}
              />
            </div>
          )}
        </>
      }
    />
  );
};
