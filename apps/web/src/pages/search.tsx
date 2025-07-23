import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";

import {
  addressSchema,
  blobCommitmentSchema,
  blobProofSchema,
  blobVersionedHashSchema,
  blockNumberSchema,
  hashSchema,
} from "@blobscan/db/prisma/zod-utils";

import { Button } from "~/components/Button";
import {
  buildAddressRoute,
  buildBlobRoute,
  buildBlockRoute,
  buildTransactionRoute,
} from "~/utils";

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
    console.log("aaaa");
    console.log(query);

    let route: string | undefined;

    if (addressSchema.safeParse(term).success) {
      route = buildAddressRoute(term);
    } else if (
      blobCommitmentSchema.safeParse(term).success ||
      blobVersionedHashSchema.safeParse(term).success ||
      blobProofSchema.safeParse(term).success
    ) {
      route = buildBlobRoute(term);
    } else if (hashSchema.safeParse(term).success) {
      route = buildTransactionRoute(term);
    } else if (
      !term.startsWith("0x") &&
      blockNumberSchema.safeParse(term).success
    ) {
      route = buildBlockRoute(term);
    }

    if (!route) {
      return {
        props: {
          term,
        },
      };
    }

    console.log(route);
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
    <div className="grid w-full place-items-center px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        <h1 className="mb-4 mt-4 text-3xl font-bold tracking-tight text-content-light dark:text-content-dark sm:text-5xl">
          Search not found
        </h1>
        {term ? (
          <p>
            &quot;
            <span className="inline-block max-w-[112px] truncate whitespace-pre align-middle text-sm md:max-w-lg">
              {term}
            </span>
            &quot;
            <span> does not match any results.</span>
          </p>
        ) : (
          <p>No search string provided.</p>
        )}
        <p className="mt-6 text-base leading-7 dark:text-contentSecondary-dark">
          You can search by blob versioned hash, blob KZG commitment, tx hash,
          block number, slot or address.
        </p>
        <div className="mt-12">
          <Button
            variant="primary"
            className="w-full max-w-md"
            onClick={() => void router.push("/")}
          >
            Go back home
          </Button>
        </div>
      </div>
    </div>
  );
}
