import { useState, useEffect, useRef, useMemo } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { CircularProgress, Alert } from "@mui/material";

import dayjs from "@blobscan/dayjs";

import { ValidatorIncomeChart } from "~/components/Charts/Validator";
import { ValidatorsIncomeLayout } from "~/components/Layouts/ValidatorsIncomeLayout";
import { DateRange } from "~/components/QuickSelectDateRangePicker";
import { api } from "~/api-client";
import NextError from "~/pages/_error";
import { normalizeTimestamp } from "~/utils";

const epochDisplayLimit = 225;
const epochDayAggDisplayLimit = 30;
const dayTimestampSecond = 86400;

function isStr(value: string): boolean {
  const nonDigitPattern = /\D/;

  return nonDigitPattern.test(value);
}

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

const Validator: NextPage = function () {
  const router = useRouter();
  const keyOrIdx = router.query.item as string;
  const keyIsStr = isStr(keyOrIdx);
  const [dateRange, setDateRange] = useState<DateRange>([
    dayjs().subtract(1, "day"),
    dayjs(),
  ]);
  const [isFirstRequest, setIsFirstRequest] = useState(true);

  const {
    data: epochGenesis,
    error: genesisErr,
    isLoading: genesisIsLoading,
  } = api.stats.getGenesisTime.useQuery();

  const prevDateRange = usePrevious(dateRange);

  const validatorIdx = useMemo(
    () => (keyIsStr ? String(0) : String(keyOrIdx)),
    [keyIsStr, keyOrIdx]
  );
  const validatorKey = useMemo(() => String(keyOrIdx), [keyOrIdx]);

  const {
    data: incomeData = {
      validatorIdx: 0,
      validatorPublicKey: "",
      epochIdx: [],
      aggEpochIdx: [],
      incomeGWei: [],
      incomeGweiDaySum: [],
      incomeGweiDaySumDate: [],
    },
    error: validatorErr,
    isLoading: validatorIsLoading,
  } = api.stats.getValidatorDetailByKeyOrIdx.useQuery(
    {
      item: "only to meet the parameter requirements of tRPC",
      validatorKey: validatorKey,
      validatorIdx: validatorIdx,
      validatorIsStr: keyIsStr,
      ...(dateRange[0] && dateRange[1]
        ? {
            startTime: dateRange[0].valueOf(), // Convert to timestamp
            endTime: dateRange[1].valueOf(),
          }
        : {}),
    },
    {
      enabled:
        router.isReady &&
        !!dateRange[0] &&
        !!dateRange[1] &&
        (isFirstRequest ||
          !prevDateRange?.[0]?.isSame(dateRange[0]) ||
          !prevDateRange?.[1]?.isSame(dateRange[1])),
    }
  );

  useEffect(() => {
    if (!validatorIsLoading) {
      setIsFirstRequest(false);
    }
  }, [validatorIsLoading]);

  incomeData.epochIdx.reverse();
  incomeData.aggEpochIdx.reverse();
  incomeData.aggEpochIdx.forEach((idx) => idx.sort());
  incomeData.incomeGWei.reverse();
  incomeData.incomeGweiDaySum.reverse();
  incomeData.incomeGweiDaySumDate.reverse();

  // if (incomeData.epochIdx.length < epochDisplayLimit) {
  //   for (let idx = 0; idx < incomeData.epochIdx.length - 1; idx++) {
  //     const diff =
  //       (incomeData.epochIdx[idx + 1] as bigint) -
  //       (incomeData.epochIdx[idx] as bigint);
  //     if (diff > BigInt(1)) {
  //       const newEntriesCount = Number(diff) - 1;

  //       if (newEntriesCount > 0) {
  //         incomeData.epochIdx.splice(
  //           idx + 1,
  //           0,
  //           ...Array.from(
  //             { length: newEntriesCount },
  //             (_, index) =>
  //               (incomeData.epochIdx[idx] as bigint) + BigInt(index + 1)
  //           )
  //         );
  //         incomeData.incomeGWei.splice(
  //           idx + 1,
  //           0,
  //           ...Array(newEntriesCount).fill(BigInt(0))
  //         );
  //       }

  //       idx += newEntriesCount;
  //     }
  //   }
  // }

  const incomeGweiDaySumDate = incomeData.incomeGweiDaySumDate.map((value) =>
    normalizeTimestamp(value).unix()
  );
  if (
    incomeGweiDaySumDate !== undefined &&
    incomeGweiDaySumDate.length < epochDayAggDisplayLimit
  ) {
    for (let idx = 0; idx < incomeGweiDaySumDate.length - 1; idx++) {
      const diff =
        (incomeGweiDaySumDate[idx + 1] as number) -
        (incomeGweiDaySumDate[idx] as number);

      if (diff > dayTimestampSecond) {
        const newEntriesCount = Math.floor(diff / dayTimestampSecond) - 1;

        if (newEntriesCount > 0) {
          incomeGweiDaySumDate.splice(
            idx + 1,
            0,
            ...Array.from(
              { length: newEntriesCount },
              (_, index) =>
                (incomeGweiDaySumDate[idx] as number) +
                (index + 1) * dayTimestampSecond
            )
          );
          incomeData.incomeGweiDaySum.splice(
            idx + 1,
            0,
            ...Array(newEntriesCount).fill(0)
          );
        }
        idx += newEntriesCount;
      }
    }
  }

  const isLoading = useMemo(
    () => validatorIsLoading || genesisIsLoading,
    [validatorIsLoading, genesisIsLoading]
  );

  const error = useMemo(
    () => (validatorErr ? validatorErr : genesisErr),
    [validatorErr, genesisErr]
  );

  const noData = useMemo(
    () =>
      !isLoading && (incomeData === undefined || epochGenesis === undefined),
    [isLoading, incomeData, epochGenesis]
  );

  const header = useMemo(
    () => `Validator ${validatorKey === "" ? "-" : validatorIdx}`,
    [validatorKey, validatorIdx]
  );

  const validatorPublicKey = useMemo(() => validatorKey || "-", [validatorKey]);

  // TODO: Using DateTimeRangePickerToolbar component instead of Select component is more in line with usage standards.
  return (
    <div>
      {error ? (
        <NextError
          title={error?.message}
          statusCode={error?.data?.httpStatus ?? 500}
        />
      ) : noData ? (
        <Alert severity="info">Not found validator rewards data.</Alert>
      ) : (
        <ValidatorsIncomeLayout
          header={
            <>
              {header}
              {isLoading ? (
                <CircularProgress className="ml-4" size={20} />
              ) : null}
            </>
          }
          validatorKey={validatorPublicKey}
          charts={[
            <ValidatorIncomeChart
              key={0}
              epochIdx={incomeData.epochIdx.slice(-epochDisplayLimit)}
              aggEpochIdx={incomeData.aggEpochIdx.slice(-epochDisplayLimit)}
              incomeData={incomeData.incomeGWei.slice(-epochDisplayLimit)}
              epochGenesisTime={
                (Number(epochGenesis?.data.genesis_time) || 0) * 1000
              }
              onDateRangeChange={setDateRange}
            />,
          ]}
        />
      )}
    </div>
  );
};

export default Validator;
