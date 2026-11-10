import type { FC } from "react";
import { useMemo } from "react";

import type { MetricCardProps } from "~/components/Cards/MetricCard";
import { FeeUnitToggle } from "~/components/Toggles";
import type { FeeUnit } from "~/components/Toggles";
import { SectionLayout } from "./SectionLayout";
import type { CardInfo } from "./helpers/cards";
import { feeMetric, skeletonCards } from "./helpers/cards";
import type { ChartSpec } from "./helpers/charts";
import { getFeeAxes, roleBars, roleLines } from "./helpers/charts";
import { getDerivedMetrics } from "./helpers/metrics";
import type { AnalyticsSectionProps } from "./types";

/** The cards of the section. They are also the skeletons while the data loads. */
const CARDS = {
  total: {
    name: "Total Blob Fees",
    description:
      "Sum of the blob base fees of the transactions. The blob base fee is the blob gas used multiplied by the blob gas price of the block.",
  },
  avgPerTx: {
    name: "Avg. Blob Fee per Tx",
    description: "Mean blob base fee of each blob transaction.",
  },
  costPerKb: {
    name: "Cost per KiB of Blob Data",
    description:
      "Blob fees divided by the size of the blob data. Unused blob space makes this cost higher.",
  },
  calldataSavings: {
    name: "Calldata Savings",
    description:
      "Fees that the address did not pay because it used blobs. It is the cost of the same data as calldata, minus the blob fees.",
  },
  wasted: {
    name: "Wasted Blob Fees",
    description:
      "Part of the blob fees that paid for unused blob space. Each blob costs the same, whether it is full or not.",
  },
} satisfies Record<string, CardInfo>;

function buildCards({
  overall,
  mainRole = "sent",
  showUsd,
}: AnalyticsSectionProps): MetricCardProps[] {
  if (!overall) {
    return skeletonCards(Object.values(CARDS));
  }

  const totals = overall[mainRole];
  const dm = getDerivedMetrics(totals);

  return [
    {
      ...CARDS.total,
      ...feeMetric(
        showUsd,
        BigInt(totals.totalBlobBaseFee),
        totals.totalBlobBaseFeeUsd
      ),
    },
    {
      ...CARDS.avgPerTx,
      ...feeMetric(showUsd, dm.avgFeePerTx, dm.avgFeePerTxUsd),
    },
    {
      ...CARDS.costPerKb,
      ...feeMetric(showUsd, dm.costPerKb, dm.costPerKbUsd),
    },
    {
      ...CARDS.calldataSavings,
      ...feeMetric(showUsd, dm.calldataSavings, dm.calldataSavingsUsd),
    },
    {
      ...CARDS.wasted,
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
