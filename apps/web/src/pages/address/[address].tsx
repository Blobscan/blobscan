import type { ReactNode } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/compat/router";

import { AddressTabs } from "~/components/Address/Tabs";
import { CategoryBadge } from "~/components/Badges/CategoryBadge";
import { RollupBadge } from "~/components/Badges/RollupBadge";
import { Copyable } from "~/components/Copyable";
import { EthIdenticon } from "~/components/EthIdenticon";
import { DetailsLayout } from "~/components/Layouts/DetailsLayout";
import type { DetailsLayoutProps } from "~/components/Layouts/DetailsLayout";
import { Link } from "~/components/Link";
import { SeoMetaTags } from "~/components/SeoMetaTags";
import { api } from "~/api-client";
import ErrorPage from "~/pages/_error";
import { routes } from "~/routes";
import type { Category, Rollup } from "~/types";
import {
  normalizeTimestamp,
  shortenHash,
  TIMESTAMP_FORMAT,
  toChecksumAddress,
} from "~/utils";

type TransactionRef = { hash: string; blockTimestamp: Date } | null;

/** A line of a field with more than one value, for example "First: 0x12…". */
function SubfieldLine({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-contentSecondary-light dark:text-contentSecondary-dark">
        {label}:
      </span>
      {children}
    </div>
  );
}

function TransactionRefLine({
  label,
  tx,
}: {
  label: string;
  tx: TransactionRef;
}) {
  const timestamp = tx ? normalizeTimestamp(tx.blockTimestamp) : undefined;

  return (
    // The hash is truncated when the row is too narrow. The label and the
    // date stay complete.
    <SubfieldLine label={label}>
      {tx && timestamp ? (
        <>
          <div className="min-w-0">
            <Link href={routes.tx(tx.hash)}>{shortenHash(tx.hash, 8)}</Link>
          </div>
          {/* The full date shows on hover. */}
          <span
            className="shrink-0 whitespace-nowrap text-sm text-contentTertiary-light dark:text-contentTertiary-dark"
            title={timestamp.format(TIMESTAMP_FORMAT)}
          >
            ({timestamp.fromNow()})
          </span>
        </>
      ) : (
        <span>-</span>
      )}
    </SubfieldLine>
  );
}

const Address: NextPage = () => {
  const router = useRouter();
  const address = (
    (router?.query.address as string | undefined) ?? ""
  ).toLowerCase();
  const checksumAddress = toChecksumAddress(address);
  const queryOpts = {
    enabled: router?.isReady && !!address,
    refetchOnWindowFocus: false,
    retry: false,
  };

  // The all-time values of the overview and of the transaction count.
  const { data: overallData, error: overallError } =
    api.address.getOverall.useQuery({ address, timeFrame: "All" }, queryOpts);
  const overall = overallData?.data;

  if (overallError) {
    return (
      <ErrorPage
        error={overallError}
        overrides={{
          BAD_REQUEST: {
            title: "Invalid Address",
            description: "Please provide a valid Ethereum address.",
          },
        }}
      />
    );
  }

  const totalTransactions = overall?.allTime.totalTransactions;
  let detailsFields: DetailsLayoutProps["fields"] | undefined;

  if (overall) {
    const { firstTransaction, lastTransaction } = overall.allTime;

    detailsFields = [
      {
        name: "Address",
        helpText: "The Ethereum address of this page.",
        value: (
          // On a narrow screen, the address is truncated. The identicon and
          // the copy button stay complete.
          <div className="flex min-w-0 items-center gap-2">
            {/* We use lower case, so that the identicon does not change with the letter case. */}
            <div className="shrink-0">
              <EthIdenticon address={address} />
            </div>
            <div className="min-w-0 [&>div]:min-w-0">
              <Copyable value={checksumAddress} tooltipText="Copy Address">
                {checksumAddress}
              </Copyable>
            </div>
          </div>
        ),
      },
      ...(overall.category
        ? [
            {
              name: "Category",
              helpText:
                "Rollup when the address posts blobs for a known rollup. Other when it does not.",
              value: <CategoryBadge category={overall.category as Category} />,
            },
          ]
        : []),
      ...(overall.rollup
        ? [
            {
              name: "Rollup",
              helpText: "The rollup that this address posts blobs for.",
              value: <RollupBadge rollup={overall.rollup as Rollup} />,
            },
          ]
        : []),
      {
        name: "Blob Txs",
        helpText:
          "The first and the last blob transaction that this address sent or received.",
        value: (
          // One line on wide screens. On narrow screens, Last goes under
          // First.
          <div className="flex min-w-0 flex-col gap-1 md:flex-row md:items-center md:gap-8">
            <TransactionRefLine label="First" tx={firstTransaction} />
            <TransactionRefLine label="Last" tx={lastTransaction} />
          </div>
        ),
      },
    ];
  }

  return (
    <>
      <SeoMetaTags
        title={`Address ${checksumAddress || "Details"}`}
        description={`Explore address ${
          checksumAddress || "details"
        } on Blobscan.`}
      />
      <DetailsLayout
        header="Address Details"
        resource={{
          type: "address",
          value: checksumAddress,
        }}
        fields={detailsFields}
      />
      <AddressTabs
        address={address}
        totalTransactions={totalTransactions}
        enabled={!!queryOpts.enabled}
      />
    </>
  );
};

export default Address;
