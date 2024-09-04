import type { NextPage } from "next";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { api } from "~/api-client";
import NextError from "~/pages/_error";
import { ValidatorIncomeChart } from "~/components/Charts/Validator";
import { ValidatorsIncomeLayout } from "~/components/Layouts/ValidatorsIncomeLayout";

const validatorEpochIncomeListLimit = 240;

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
    isLoading: genesisIsLoading
  } = api.stats.getGenesisTime.useQuery();
  const {
    data: incomeData,
    error: validatorErr,
    isLoading: validatorIsLoading
  } = api.stats.getValidatorDetailByKeyOrIdx.useQuery(
    {
      item: "only to meet the parameter requirements of tRPC",
      validatorKey: String(keyOrIdx),
      validatorIdx: keyIsStr ? String(0) : String(keyOrIdx),
      validatorIsStr: keyIsStr,
      listLimit: validatorEpochIncomeListLimit,
    },
    {
      enabled: router.isReady && !hasFetchData,
    }
  );
  useEffect(() => {
    if (incomeData) {
      setHasFetchData(true);
    }
  }, [incomeData]);

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

    return <div>Searching for validator reward relevant data</div>
  }

  if (incomeData === undefined || epochGenesis === undefined) {

    return <div>not found validator rewards data</div>;
  }

  incomeData.epochIdx.reverse();
  incomeData.incomeGWei.reverse();
  for (let idx = 0; idx < incomeData.epochIdx.length - 1; idx++) {
    const diff = (incomeData.epochIdx[idx + 1] as bigint) - (incomeData.epochIdx[idx] as bigint);

    if (diff > BigInt(1)) {
      incomeData.epochIdx.splice(idx + 1, 0, ...Array.from({ length: Number(diff) - 1 }, (_, index) => (incomeData.epochIdx[idx] as bigint) + BigInt(index + 1)));
      incomeData.incomeGWei.splice(idx + 1, 0, ...Array(Number(diff) - 1).fill(BigInt(0)));

      idx++;
    }

    if (idx + 1 >= incomeData.epochIdx.length - 1) {
      if (incomeData.epochIdx.length > validatorEpochIncomeListLimit) {
        const excessLength = incomeData.epochIdx.length - validatorEpochIncomeListLimit;

        incomeData.epochIdx = incomeData.epochIdx.slice(excessLength);
        incomeData.incomeGWei = incomeData.incomeGWei.slice(excessLength);
      }

      break;
    }
  }

  return (
    <div>
      <ValidatorsIncomeLayout
        header={`Validator ${incomeData.validatorPublicKey === "" ? "-" : incomeData.validatorIdx}`}
        validatorKey={`${incomeData.validatorPublicKey}`}
        charts={[
          <ValidatorIncomeChart
            key={0}
            epochIdx={incomeData.epochIdx}
            incomeData={incomeData.incomeGWei}
            epochGenesisTime={Number(epochGenesis.data.genesis_time) * 1000}
          />,
        ]}
      />
    </div>
  );
}

export default Validator;
