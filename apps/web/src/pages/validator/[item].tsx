import type { NextPage } from "next";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { api } from "~/api-client";
import NextError from "~/pages/_error";
import { normalizeTimestamp } from "~/utils";
import { ValidatorIncomeChart } from "~/components/Charts/Validator";
import { ValidatorsIncomeLayout } from "~/components/Layouts/ValidatorsIncomeLayout";

const epochDisplayLimit = 225;
const epochDayAggDisplayLimit = 30;
const dayTimestampSecond = 86400;

function isStr(value: string): boolean {
  const nonDigitPattern = /\D/;

  return nonDigitPattern.test(value);
}

const Validator: NextPage = function () {
  const router = useRouter();
  const keyOrIdx = router.query.item as string;
  const keyIsStr = isStr(keyOrIdx);
  const [hasFetchData, setHasFetchData] = useState(false);

  const {
    data: epochGenesis,
    error: genesisErr,
    isLoading: genesisIsLoading,
  } = api.stats.getGenesisTime.useQuery();

  const {
    data: incomeData,
    error: validatorErr,
    isLoading: validatorIsLoading,
  } = api.stats.getValidatorDetailByKeyOrIdx.useQuery(
    {
      item: "only to meet the parameter requirements of tRPC",
      validatorKey: String(keyOrIdx),
      validatorIdx: keyIsStr ? String(0) : String(keyOrIdx),
      validatorIsStr: keyIsStr,
    },
    {
      enabled: router.isReady && !hasFetchData,
    }
  );

  useEffect(() => {
    if (!validatorIsLoading && !genesisIsLoading) {
      setHasFetchData(true);
    }
  }, [validatorIsLoading, genesisIsLoading]);

  if (validatorErr || genesisErr) {
    const error = validatorErr ? validatorErr : genesisErr;
    return (
      <NextError
        title={error?.message}
        statusCode={error?.data?.httpStatus ?? 500}
      />
    );
  }

  if ((!validatorIsLoading || !genesisIsLoading) && !incomeData) {

    return <div>Searching for validator reward relevant data</div>;
  }

  if (incomeData === undefined || epochGenesis === undefined) {

    return <div>Not found validator rewards data</div>;
  }

  incomeData.epochIdx.reverse();
  incomeData.incomeGWei.reverse();
  incomeData.incomeGweiDaySum.reverse();
  incomeData.incomeGweiDaySumDate.reverse();

  if (incomeData.epochIdx.length < epochDisplayLimit) {
    for (let idx = 0; idx < incomeData.epochIdx.length - 1; idx++) {
      const diff = (incomeData.epochIdx[idx + 1] as bigint) - (incomeData.epochIdx[idx] as bigint);
      if (diff > BigInt(1)) {
        const newEntriesCount = Number(diff) - 1;

        if (newEntriesCount > 0) {
          incomeData.epochIdx.splice(
            idx + 1,
            0,
            ...Array.from({ length: newEntriesCount }, (_, index) => (incomeData.epochIdx[idx] as bigint) + BigInt(index + 1))
          );
          incomeData.incomeGWei.splice(idx + 1, 0, ...Array(newEntriesCount).fill(BigInt(0)));
        }

        idx += newEntriesCount;
      }
    }
  }

  const incomeGweiDaySumDate = incomeData.incomeGweiDaySumDate.map(
    value => normalizeTimestamp(value).unix()
  );
  if (incomeGweiDaySumDate !== undefined && incomeGweiDaySumDate.length < epochDayAggDisplayLimit) {
    for (let idx = 0; idx < incomeGweiDaySumDate.length - 1; idx++) {
      const diff = (incomeGweiDaySumDate[idx + 1] as number) - (incomeGweiDaySumDate[idx] as number);

      if (diff > dayTimestampSecond) {
        const newEntriesCount = Math.floor(diff / dayTimestampSecond) - 1;

        if (newEntriesCount > 0) {
          incomeGweiDaySumDate.splice(
            idx + 1,
            0,
            ...Array.from({ length: newEntriesCount }, (_, index) => (incomeGweiDaySumDate[idx] as number) + index * dayTimestampSecond)
          );
          incomeData.incomeGweiDaySum.splice(idx + 1, 0, ...Array(newEntriesCount).fill(0));
        }
        idx += newEntriesCount;
      }
    }
  }

  // TODO: Using DateTimeRangePickerToolbar component instead of Select component is more in line with usage standards.
  return (
    <div>
      <ValidatorsIncomeLayout
        header={`Validator ${incomeData.validatorPublicKey === "" ? "-" : incomeData.validatorIdx}`}
        validatorKey={`${incomeData.validatorPublicKey}`}
        charts={[
          <ValidatorIncomeChart
            key={0}
            epochIdx={incomeData.epochIdx.slice(-epochDisplayLimit)}
            incomeData={incomeData.incomeGWei.slice(-epochDisplayLimit)}
            epochGenesisTime={Number(epochGenesis.data.genesis_time) * 1000}
          />,
          <ValidatorIncomeChart
            key={1}
            incomeGweiDaySum={incomeData.incomeGweiDaySum.slice(-epochDayAggDisplayLimit)}
            incomeGweiDaySumDate={incomeGweiDaySumDate.slice(-epochDayAggDisplayLimit)}
            minDistanceTimestamp={dayTimestampSecond}
            displayDay={true}
          />,
        ]}
      />
    </div>
  );
};

export default Validator;
