import type { FC } from "react";
import type { ValidatorIncome } from "~/types";

import { ChartCardWithSlider } from "~/components/Cards/ChartCardWithSlider";
import { formatWei, normalizeTimestamp } from "~/utils";

export type ValidatorIncomeChartProps = {
  epochIdx: ValidatorIncome["epochIdx"];
  incomeData: ValidatorIncome["incomeGWei"];
  incomeGweiDaySum: ValidatorIncome["incomeGweiDaySum"],
  incomeGweiDaySumDate: number[],
  epochGenesisTime: number;

  displayDay: boolean,
  minDistanceTimestamp: number;
  compact: boolean;
}

const EpochTimestampUnit = 384000;
const MSConvertRatio = 1000;

export const ValidatorIncomeChart: FC<Partial<ValidatorIncomeChartProps>> = function ({
  epochIdx,
  incomeData,
  epochGenesisTime,
  incomeGweiDaySum,
  incomeGweiDaySumDate,
  displayDay = false,
  minDistanceTimestamp = EpochTimestampUnit / MSConvertRatio,
  compact = false,
}) {
  if (displayDay) {

    if (!Array.isArray(incomeGweiDaySum) || incomeGweiDaySum.length === 0 ||
      incomeGweiDaySumDate === undefined) {

      return (
        <ChartCardWithSlider
          allData={[]}
          allAxle={[]}
          initCoordinateAxle={[]}
          minDistance={minDistanceTimestamp}
          title="Epoch Rewards(GWei)"
          size="lg"
          compact={compact}
          sliderStep={minDistanceTimestamp}
        />
      )
    }

    return (
      <ChartCardWithSlider
        title="Epoch Rewards Daily Rewards(DILL)"
        size="lg"
        compact={compact}
        allData={incomeGweiDaySum}
        allAxle={incomeGweiDaySumDate}
        initCoordinateAxle={[incomeGweiDaySumDate[0] as number, incomeGweiDaySumDate[incomeGweiDaySumDate.length - 1] as number]}

        xAxisLabel={(value) => {
          const date = normalizeTimestamp(value);

          return `${date.format("YYYY/MM/DD")}`;
        }}
        xAxisTooltip={(value) => {
          const date = normalizeTimestamp(value);

          return `${date.format("YYYY/MM/DD")}`;
        }}
        yAxisLabel={(value) => formatWei(value * 1e9, { toUnit: "DILL", displayUnit: true, compact: false })}
        yAxisTooltip={(value) => formatWei(value * 1e9, { toUnit: "DILL", displayUnit: true, compact: false })}

        minDistance={minDistanceTimestamp}
        sliderStep={minDistanceTimestamp}
      />
    )
  }

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
      title="Epoch Rewards(DILL)"
      size="lg"
      compact={compact}
      allData={incomeData.map(value => Number(value))}
      allAxle={axleTimestamp}
      initCoordinateAxle={[axleTimestamp[0] as number, axleTimestamp[axleTimestamp.length - 1] as number]}

      xAxisLabel={(value) => {
        const date = normalizeTimestamp(value);

        return `
        ${date.format("HH:mm:ss")}
        Epoch ${epochIdx[axleTimestamp.indexOf(date.unix())]}
        `;
      }}
      xAxisTooltip={(value) => {
        const date = normalizeTimestamp(value);

        return `
        ${date.format("YYYY/MM/DD HH:mm:ss")}
        (Epoch ${epochIdx[axleTimestamp.indexOf(date.unix())]})
        `;
      }}
      yAxisLabel={(value) => formatWei(value * 1e9, { toUnit: "DILL", displayUnit: true, compact: false })}
      yAxisTooltip={(value) => formatWei(value * 1e9, { toUnit: "DILL", displayUnit: true, compact: false })}

      minDistance={minDistanceTimestamp}
      sliderStep={EpochTimestampUnit / MSConvertRatio}
    />
  )
}
