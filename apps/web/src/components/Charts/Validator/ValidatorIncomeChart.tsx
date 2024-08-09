import type { FC } from "react";
import type { ValidatorIncome } from "~/types";

import { ChartCardWithSlider } from "~/components/Cards/ChartCardWithSlider";
import { normalizeTimestamp } from "~/utils";

export type ValidatorIncomeChartProps = {
  incomeData: ValidatorIncome["incomeWei"];
  epochIdx: ValidatorIncome["epochIdx"];
  epochGenesisTime: number;
  minDistanceTimestamp: number;
  compact: boolean;
}

const EpochTimestampUnit = 384000;
const MSConvertRatio = 1000;

export const ValidatorIncomeChart: FC<Partial<ValidatorIncomeChartProps>> = function ({
  epochIdx,
  incomeData,
  epochGenesisTime,
  minDistanceTimestamp = EpochTimestampUnit / MSConvertRatio,
  compact = false,
}) {
  if (!Array.isArray(incomeData) || incomeData.length == 0 ||
    epochIdx === undefined || epochGenesisTime === undefined
  ) {

    return (
      <ChartCardWithSlider
        allData={[]}
        allAxle={[]}
        initCoordinateAxle={[]}
        minDistance={minDistanceTimestamp}
        title="Epoch Rewards(GWei)"
        size="lg"
        compact={compact}
        sliderStep={EpochTimestampUnit}
      />
    )
  }

  const axleTimestamp = epochIdx.map(
    value => (epochGenesisTime + EpochTimestampUnit * Number(value)) / MSConvertRatio
  );

  return (
    <ChartCardWithSlider
      title="Epoch Rewards(GWei)"
      size="lg"
      compact={compact}
      allData={incomeData}
      allAxle={axleTimestamp}
      initCoordinateAxle={[axleTimestamp[0] as number, axleTimestamp[axleTimestamp.length - 1] as number]}
      xAxisLabel={(value) => {
        const date = normalizeTimestamp(value);

        return `
        ${date.format("HH:mm:ss")}
        Epoch ${epochIdx[axleTimestamp.indexOf(date.unix())]}
        `;
      }}

      minDistance={minDistanceTimestamp}
      sliderStep={EpochTimestampUnit / MSConvertRatio}
    />
  )
}
