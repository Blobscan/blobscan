import type { NextPage } from "next";
import NextError from "next/error";
import { useRouter } from "next/router";

import { api } from "~/utils/api";
import { getPaginationParams } from "~/utils/pagination";
import { BlobTransactionCard } from "~/components/Cards/SurfaceCards/BlobTransactionCard";
import { EthIdenticon } from "~/components/EthIdenticon";
import { DetailsLayout } from "~/components/Layouts/DetailsLayout/";
import { PaginatedListLayout } from "~/components/Layouts/PaginatedListLayout";
import { buildAddressExternalUrl } from "~/utils";

const Address: NextPage = () => {
  const router = useRouter();
  const { p, ps } = getPaginationParams(router.query);
  const address = (router.query.address as string | undefined) ?? "";

  const { data: addressData, error } = api.tx.getByAddress.useQuery(
    { address, p, ps },
    { enabled: router.isReady },
  );

  if (error) {
    return (
      <NextError
        title={error.message}
        statusCode={error.data?.httpStatus ?? 500}
      />
    );
  }

  return (
    <>
      <DetailsLayout
        header="Address Details"
        externalLink={buildAddressExternalUrl(address)}
        fields={[
          {
            name: "Address",
            value: (
              <div className="flex items-center gap-2">
                <div className="relative bottom-0.5">
                  <EthIdenticon address={address} />
                </div>
                <div className="">{address}</div>
              </div>
            ),
          },
        ]}
      />
      <PaginatedListLayout
        title={`Blob Transactions ${
          addressData ? `(${addressData.totalTransactions})` : ""
        }`}
        items={addressData?.transactions.map((t) => (
          <BlobTransactionCard key={t.hash} transaction={t} />
        ))}
        totalItems={addressData?.totalTransactions}
        page={p}
        pageSize={ps}
        itemSkeleton={<BlobTransactionCard />}
      />
    </>
  );
};

export default Address;
