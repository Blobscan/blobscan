import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";

import { searchByTerm } from "@blobscan/api";

import { Button } from "~/components/Button";
import type { SearchResults } from "~/types";
import { getRouteBySearchCategory } from "~/utils";

type SearchCategory = keyof SearchResults;

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

    const searchResults = await searchByTerm(term);
    const categories = Object.keys(searchResults) as SearchCategory[];

    if (categories.length === 0) {
      return {
        props: {
          term,
        },
      };
    }

    if (categories.length === 1) {
      const category = categories[0] as SearchCategory;
      const results = searchResults[category];

      // TODO: display paginated results for terms with multiple matches
      if (!results || !results.length || results.length > 1) {
        return {
          props: {
            term,
          },
        };
      }

      const id = results[0]?.id as string;

      return {
        redirect: {
          permanent: true,
          destination: getRouteBySearchCategory(category, id),
        },
      };
    }

    // TODO: display paginated results for terms with multiple matches
    return {
      props: {
        term,
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
