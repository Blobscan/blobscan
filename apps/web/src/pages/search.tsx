import type { GetServerSideProps } from "next";
import Image from "next/image";
import { useRouter } from "next/router";
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
import { Icon } from "~/components/Icon";
import {
  buildAddressRoute,
  buildBlobRoute,
  buildBlockRoute,
  buildTransactionRoute,
} from "~/utils";

type SearchProps = {
  term: string;
};

function GlowingEffect() {
  return (
    <div className="animate-glow absolute right-[20%] top-[70%] h-[0.5px] w-[0.5px] bg-transparent" />
  );
}

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
    <main className="flex w-full flex-col items-center gap-4">
      <div className="relative">
        <GlowingEffect />
        <Image
          src="/not-found.png"
          alt="404"
          width={350}
          height={350}
          sizes="(max-width: 768px) 150px, (max-width: 1024px) 250px, 350px"
          className="h-[250px] w-[250px] md:h-[250px] md:w-[250px] lg:h-[350px] lg:w-[350px]"
          priority
        />
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
          onClick={() => void router.back()}
        >
          <div className="flex items-center justify-center gap-2">
            <Icon src={ArrowUturnLeftIcon} />
            Go back
          </div>
        </Button>
      </div>
    </main>
  );
}
