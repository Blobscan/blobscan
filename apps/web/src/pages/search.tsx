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
      <div className="flex flex-col items-center gap-6 text-center">
        <h1 className="mb-4 mt-4 text-3xl font-bold tracking-tight text-content-light dark:text-content-dark sm:text-5xl">
          Oops! Nothing matched your search
        </h1>
        {term ? (
          <p className="text-contentSecondary-light dark:text-contentSecondary-dark">
            No results found for &quot;
            <span className="inline-block max-w-[112px] whitespace-pre align-middle text-sm text-content-light dark:text-content-dark md:max-w-lg">
              {term}
            </span>
            &quot;.
          </p>
        ) : (
          <p>No search string provided.</p>
        )}
        <p className="text-sm leading-7 text-contentTertiary-light dark:text-contentTertiary-dark md:w-3/6">
          Valid inputs include addresses, transaction hashes, block numbers,
          block hashes, slots, and blob identifiers such as versioned hashes,
          KZG commitments, or proofs.
        </p>
        <Button
          variant="primary"
          className="w-full md:w-56"
          onClick={() => void router.back()}
        >
          Go back
        </Button>
      </div>
    </div>
  );
}
