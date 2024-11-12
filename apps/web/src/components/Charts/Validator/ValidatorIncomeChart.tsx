import type { FC } from "react";
import { useMemo } from "react";

import { ChartCardWithSlider } from "~/components/Cards/ChartCardWithSlider";
import QuickSelectDateRangePicker, {
  QuickSelectDateRangePickerProps,
} from "~/components/QuickSelectDateRangePicker";
import type { ValidatorIncome } from "~/types";
import { formatWei, normalizeTimestamp } from "~/utils";

export type ValidatorIncomeChartProps = {
  epochIdx: ValidatorIncome["epochIdx"];
  aggEpochIdx: ValidatorIncome["aggEpochIdx"];
  incomeData: ValidatorIncome["incomeGWei"];
  incomeGweiDaySum: ValidatorIncome["incomeGweiDaySum"];
  incomeGweiDaySumDate: number[];
  epochGenesisTime: number;

  displayDay: boolean;
  minDistanceTimestamp: number;
  compact: boolean;
  onDateRangeChange: QuickSelectDateRangePickerProps["onChange"];
};

const EpochTimestampUnit = 384000;
const MSConvertRatio = 1000;

const getTimestampFromEpoch = (epochGenesisTime: number, idx: bigint) =>
  ((epochGenesisTime || 0) + EpochTimestampUnit * Number(idx || 0)) /
  MSConvertRatio;

export const ValidatorIncomeChart: FC<Partial<ValidatorIncomeChartProps>> =
  function ({
    epochIdx,
    aggEpochIdx,
    incomeData,
    epochGenesisTime,
    incomeGweiDaySum,
    incomeGweiDaySumDate,
    displayDay = false,
    minDistanceTimestamp = EpochTimestampUnit / MSConvertRatio,
    compact = false,
    onDateRangeChange = () => void 0,
  }) {
    const sliderStep = useMemo(
      () =>
        (EpochTimestampUnit / MSConvertRatio) *
        (aggEpochIdx?.slice(-1)[0]?.length || 1),
      [EpochTimestampUnit, MSConvertRatio, aggEpochIdx]
    );

    const axleTimestamp = useMemo(
      () =>
        aggEpochIdx
          ?.map((idx) =>
            getTimestampFromEpoch(epochGenesisTime || 0, idx?.[0] || BigInt(0))
          )
          .sort() || [],
      [aggEpochIdx, epochGenesisTime]
    );

    if (displayDay) {
      if (
        !Array.isArray(incomeGweiDaySum) ||
        incomeGweiDaySum.length === 0 ||
        incomeGweiDaySumDate === undefined
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
            sliderStep={minDistanceTimestamp}
          />
        );
      }

      return (
        <ChartCardWithSlider
          title="Epoch Rewards Daily Rewards(DILL)"
          size="lg"
          compact={compact}
          allData={incomeGweiDaySum}
          allAxle={incomeGweiDaySumDate}
          initCoordinateAxle={[
            incomeGweiDaySumDate[0] as number,
            incomeGweiDaySumDate[incomeGweiDaySumDate.length - 1] as number,
          ]}
          xAxisLabel={(value) => {
            const date = normalizeTimestamp(value);

            return `${date.format("YYYY/MM/DD")}`;
          }}
          xAxisTooltip={(value) => {
            const date = normalizeTimestamp(value);

            return `${date.format("YYYY/MM/DD")}`;
          }}
          yAxisLabel={(value) =>
            formatWei(value * 1e9, {
              toUnit: "DILL",
              displayUnit: true,
              compact: false,
            })
          }
          yAxisTooltip={(value) =>
            formatWei(value * 1e9, {
              toUnit: "DILL",
              displayUnit: true,
              compact: false,
            })
          }
          minDistance={minDistanceTimestamp}
          sliderStep={minDistanceTimestamp}
        />
      );
    }

    // const axleTimestamp = epochIdx?.map(
    //   (value) =>
    //     ((epochGenesisTime || 0) + EpochTimestampUnit * Number(value)) /
    //     MSConvertRatio
    // );

    return (
      <>
        <div>
          <QuickSelectDateRangePicker
            // onInitialChange={onDateRangeChange}
            onChange={onDateRangeChange}
          />
        </div>
        <ChartCardWithSlider
          title="Epoch Rewards(DILL)"
          size="lg"
          compact={compact}
          allData={incomeData?.map((value) => Number(value)) || []}
          allAxle={axleTimestamp || []}
          initCoordinateAxle={[
            (axleTimestamp?.[0] || 0) as number,
            axleTimestamp?.[axleTimestamp.length - 1] as number,
          ]}
          xAxisLabel={(value) => {
            const date = normalizeTimestamp(value);
            const i = axleTimestamp?.indexOf(date.unix()) || 0;
            const aggEpoch = aggEpochIdx?.[i] || [];
            const aggEpochLen = aggEpoch.length;
            if (aggEpochLen === 1) {
              return `
              ${date.format("YYYY/MM/DD HH:mm:ss")}
              Epoch ${epochIdx?.[axleTimestamp?.indexOf(date.unix()) || 0]}
              `;
            }

            const minDate = getTimestampFromEpoch(
              epochGenesisTime || 0,
              aggEpoch[0] || BigInt(0)
            );
            return `
            ${normalizeTimestamp(minDate).format("YYYY/MM/DD HH:mm:ss")}
            Epoch ${aggEpoch[0]}
            `;
          }}
          xAxisTooltip={(value) => {
            const date = normalizeTimestamp(value);
            const i = axleTimestamp?.indexOf(date.unix()) || 0;
            const aggEpoch = aggEpochIdx?.[i] || [];
            const aggEpochLen = aggEpoch.length;
            if (aggEpochLen === 1) {
              return `
              ${date.format("YYYY/MM/DD HH:mm:ss")}
              (Epoch ${epochIdx?.[axleTimestamp?.indexOf(date.unix()) || 0]})
              `;
            }
            const minDate = getTimestampFromEpoch(
              epochGenesisTime || 0,
              aggEpoch[0] || BigInt(0)
            );
            const maxDate = getTimestampFromEpoch(
              epochGenesisTime || 0,
              aggEpoch[aggEpochLen - 1] || BigInt(0)
            );

            return `
          ${normalizeTimestamp(minDate).format(
            "YYYY/MM/DD HH:mm:ss"
          )} - ${normalizeTimestamp(maxDate).format("YYYY/MM/DD HH:mm:ss")}
          (Epoch ${aggEpoch[0]} - ${aggEpoch[aggEpochLen - 1]})
          `;
          }}
          yAxisLabel={(value) =>
            formatWei(value * 1e9, {
              toUnit: "DILL",
              displayUnit: true,
              compact: false,
            })
          }
          yAxisTooltip={(value) =>
            formatWei(value * 1e9, {
              toUnit: "DILL",
              displayUnit: true,
              compact: false,
            })
          }
          minDistance={minDistanceTimestamp}
          sliderStep={sliderStep}
          showSlider={false}
        />
      </>
    );
  };
