import { RollupBadgeGroup } from "~/components/Badges/RollupBadgeGroup";
import { Table } from "~/components/Table";
import type { Rollup } from "~/types";

const samples: Partial<Record<Rollup, number>>[] = [
  { arbitrum: 1, optimism: 2, base: 1, linea: 1, scroll: 2, zksync: 1 },
  {
    arbitrum: 2,
    optimism: 1,
    base: 1,
    linea: 1,
    scroll: 1,
    zksync: 1,
    blast: 1,
    bob: 1,
    boba: 1,
    fraxtal: 1,
  },
  { arbitrum: 2, optimism: 1, base: 3, linea: 1, scroll: 1 },
  { arbitrum: 1, optimism: 2, base: 1, linea: 1 },
];

export default function BlocksPreview() {
  return (
    <main className="px-4 py-8 sm:px-8">
      <h1 className="text-2xl font-bold">Blocks · Sample preview</h1>
      <p className="mb-6 mt-2 text-sm text-contentSecondary-light dark:text-contentSecondary-dark">
        Sample rows with 6, 10, 5, and 4 rollups. Hover over or select +N to see
        every rollup and its transaction count.
      </p>
      <Table
        headers={[
          {
            cells: [
              { item: "Rollups", className: "w-[160px]" },
              { item: "Block number" },
              { item: "Age" },
              { item: "Slot" },
              { item: "Txs" },
              { item: "Blobs" },
              { item: "Blob Usage (KiB)" },
              { item: "Blob Gas Price (Gwei)" },
            ],
          },
        ]}
        rows={samples.map((amounts, index) => {
          const count = Object.values(amounts).reduce(
            (sum, amount) => sum + amount,
            0
          );

          return {
            cells: [
              { item: <RollupBadgeGroup amounts={amounts} /> },
              {
                item: (
                  <span className="text-primary-500">{24000359 - index}</span>
                ),
              },
              { item: `${12 + index * 12} seconds ago` },
              { item: 15633393 - index },
              { item: count },
              { item: count },
              { item: `${count * 64} / ${count * 128} (50%)` },
              { item: "1" },
            ],
          };
        })}
      />
    </main>
  );
}

export function getServerSideProps() {
  return process.env.NODE_ENV === "development"
    ? { props: {} }
    : { notFound: true };
}
