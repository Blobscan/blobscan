import type { GetServerSideProps } from "next";
import { useRouter } from "next/compat/router";
import { ArrowUturnLeftIcon } from "@heroicons/react/24/outline";

import {
  addressSchema,
  blobCommitmentSchema,
  blobProofSchema,
  blobVersionedHashSchema,
  blockNumberSchema,
  hashSchema,
} from "@blobscan/db/prisma/zod-utils";

import { Button } from "~/components/Button";
import { SearchingBlob } from "~/components/ErrorViews/SearchingBlob";
import { Icon } from "~/components/Icon";
import { SeoMetaTags } from "~/components/SeoMetaTags";
import { routes } from "~/routes";

type SearchProps = {
  term: string;
};

export const getServerSideProps: GetServerSideProps<SearchProps> =
  async function ({ query }) {
    const term = query.q as string | undefined;

    if (!term) {
      return {
        props: {
          term: "",
        },
      };
    }

    let route: string | undefined;
    const parsedAddress = addressSchema.safeParse(term);

    if (parsedAddress.success) {
      // Use the lower-case address, so that each address has one URL.
      route = routes.address(parsedAddress.data);
    } else if (
      blobCommitmentSchema.safeParse(term).success ||
      blobVersionedHashSchema.safeParse(term).success ||
      blobProofSchema.safeParse(term).success
    ) {
      route = routes.blob(term);
    } else if (hashSchema.safeParse(term).success) {
      route = routes.tx(term);
    } else if (
      !term.startsWith("0x") &&
      blockNumberSchema.safeParse(term).success
    ) {
      route = routes.block(term);
    }

    if (!route) {
      return {
        props: {
          term,
        },
      };
    }

    return {
      redirect: {
        permanent: true,
        destination: route,
      },
    };
  };

export default function Search({ term }: SearchProps) {
  const router = useRouter();

  return (
    <>
      <SeoMetaTags
        title="Search"
        description="Search for blobs, transactions, blocks, and addresses on Blobscan."
      />
      <main className="flex w-full flex-col items-center gap-4">
        <div className="mt-16 w-[150px] shrink-0 md:w-[220px] lg:w-[260px]">
          <SearchingBlob />
        </div>
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="mb-4 mt-4 text-3xl font-bold tracking-tight text-content-light dark:text-content-dark sm:text-5xl">
            Oops! Nothing matched your search
          </h1>
          {term ? (
            <p className="text-contentSecondary-light dark:text-contentSecondary-dark">
              We couldn&apos;t find any results for &quot;
              <span className="inline-block max-w-[112px] whitespace-pre align-middle text-sm text-content-light dark:text-content-dark md:max-w-lg">
                {term}
              </span>
              &quot;.
            </p>
          ) : (
            <p>No search string provided.</p>
          )}
          <div className="text-sm  text-contentTertiary-light dark:text-contentTertiary-dark md:w-4/6">
            <p>Try searching with a valid identifier, such as:</p>
            <div className="flex flex-col items-center ">
              <ul className="mt-6  list-outside list-disc text-left">
                <li>Addresses.</li>
                <li>Slots.</li>
                <li>Transaction hashes.</li>
                <li>Block numbers or hashes.</li>
                <li>Blob versioned hashes, commitments or proofs.</li>
              </ul>
            </div>
          </div>
          <Button
            variant="primary"
            className="mt-4 w-72 lg:w-96"
            onClick={() => void router?.back()}
          >
            <div className="flex items-center justify-center gap-2">
              <Icon src={ArrowUturnLeftIcon} />
              Go back
            </div>
          </Button>
        </div>
      </main>
    </>
  );
}
