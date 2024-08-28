import type { NextPage } from "next";

import { useRouter } from "next/router";

import { api } from "~/api-client";
import NextError from "~/pages/_error";
import { ValidatorIncomeChart } from "~/components/Charts/Validator";
import { ValidatorsIncomeLayout } from "~/components/Layouts/ValidatorsIncomeLayout";

const validatorEpochIncomeListLimit = 60;

const Validator: NextPage = function () {
  const router = useRouter();
  const keyOrIdx = router.query.item as string;
  const isStr = !Number(keyOrIdx);
  const {
    data: incomeData,
    error: validatorErr,
    isLoading: validatorIsLoading
  } = api.stats.getValidatorDetailByKeyOrIdx.useQuery(
    {
      item: "only to meet the parameter requirements of tRPC",
      validatorKey: keyOrIdx,
      validatorIdx: isStr ? BigInt(0) : BigInt(keyOrIdx),
      validatorIsStr: isStr,
      listLimit: validatorEpochIncomeListLimit,
    },
    {
      enabled: router.isReady,
    }
  );
  const {
    data: epochGenesis,
    error: genesisErr,
    isLoading: genesisIsLoading
  } = api.stats.getGenesisTime.useQuery();

  if (validatorErr || genesisErr) {
    const error = validatorErr ? validatorErr : genesisErr;
    return (
      <NextError
        title={error?.message}
        statusCode={error?.data?.httpStatus ?? 500}
      />
    );
  }

  if (((!validatorIsLoading || !genesisIsLoading) && !incomeData) ||
    incomeData === undefined || epochGenesis === undefined) {

    return <div>not found validator rewards data</div>;
  }

  return (
    <div>
      <ValidatorsIncomeLayout
        header={`Validator ${incomeData.validatorIdx}`}
        validatorKey={`${incomeData.validatorPublicKey}`}
        charts={[
          <ValidatorIncomeChart
            key={0}
            epochIdx={incomeData.epochIdx}
            incomeData={incomeData.incomeWei}
            epochGenesisTime={Number(epochGenesis.data.genesis_time) * 1000}
          />,
        ]}
      />
    </div>
  );
}

export default Validator;
