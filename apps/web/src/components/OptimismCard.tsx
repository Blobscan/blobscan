import type { FC } from "react";

import type { OptimismDecodedData } from "@blobscan/api/src/blob-parse/optimism";
import type dayjs from "@blobscan/dayjs";

import { InfoGrid } from "~/components/InfoGrid";
import { Link } from "~/components/Link";
import { api } from "~/api-client";
import Loading from "~/icons/loading.svg";
import { formatTimestamp } from "~/utils";
import { Card } from "./Cards/Card";
import { Copyable } from "./Copyable";

type OptimismCardProps = {
  data: OptimismDecodedData;
  txTimestamp?: dayjs.Dayjs;
};

export const OptimismCard: FC<OptimismCardProps> = ({ data, txTimestamp }) => {
  const { data: blockExists, isLoading } = api.block.checkBlockExists.useQuery({
    blockNumber: data.lastL1OriginNumber,
  });

  const blockLink = blockExists
    ? `https://blobscan.com/block/${data.lastL1OriginNumber}`
    : `https://etherscan.io/block/${data.lastL1OriginNumber}`;

  const hash = `0x${data.l1OriginBlockHash}...`;

  const timestamp = txTimestamp
    ? formatTimestamp(txTimestamp.subtract(data.timestampSinceL2Genesis, "ms"))
    : undefined;

  if (isLoading) {
    return (
      <Card header="Loading Decoded Fields...">
        <div className="flex h-32 items-center justify-center">
          <Loading className="h-8 w-8 animate-spin" />
        </div>
      </Card>
    );
  }

  return (
    <Card header="Decoded Fields">
      <InfoGrid
        fields={[
          {
            name: "Timestamp Since L2 Genesis",
            value: <div className="whitespace-break-spaces">{timestamp}</div>,
          },
          {
            name: "Last L1 Origin Number",
            value: (
              <Copyable
                value={data.lastL1OriginNumber.toString()}
                tooltipText="Copy last L1 origin number"
              >
                <Link href={blockLink}>{data.lastL1OriginNumber}</Link>
              </Copyable>
            ),
          },
          {
            name: "Parent L2 Partial Block Hash",
            value: "0x" + data.parentL2BlockHash + "...",
          },
          {
            name: "L1 Origin Partial Block Hash",
            value: (
              <Copyable value={hash} tooltipText="Copy L1 origin block hash">
                <Link href={blockLink}>{hash}</Link>
              </Copyable>
            ),
          },
          {
            name: "Number Of L2 Blocks",
            value: data.numberOfL2Blocks,
          },
          {
            name: "Changed By L1 Origin",
            value: data.changedByL1Origin,
          },
          {
            name: "Total Transactions",
            value: data.totalTxs,
          },
          {
            name: "Contract Creation Transactions",
            value: data.contractCreationTxsNumber,
          },
        ]}
      />
    </Card>
  );
};
