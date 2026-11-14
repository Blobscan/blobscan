import { RollupBadgeGroup } from "~/components/Badges/RollupBadgeGroup";
import type { Rollup } from "~/types";

const examples: { label: string; amounts: Partial<Record<Rollup, number>> }[] =
  [
    { label: "1 icon · 1 transaction", amounts: { arbitrum: 1 } },
    {
      label: "2 icons · 3 and 9 transactions",
      amounts: { arbitrum: 3, optimism: 9 },
    },
    {
      label: "4 icons · 1, 8, 12, and 24 transactions",
      amounts: { arbitrum: 1, optimism: 8, base: 12, linea: 24 },
    },
    {
      label: "6 rollups · 4 icons and +2",
      amounts: {
        arbitrum: 2,
        optimism: 7,
        base: 16,
        linea: 32,
        scroll: 64,
        zksync: 99,
      },
    },
    {
      label: "10 rollups · 4 icons and +6",
      amounts: {
        arbitrum: 3,
        optimism: 9,
        base: 12,
        linea: 24,
        scroll: 32,
        zksync: 64,
        blast: 8,
        bob: 16,
        boba: 100,
        fraxtal: 999,
      },
    },
    {
      label: "20 rollups · keyboard scroll example",
      amounts: {
        arbitrum: 1,
        optimism: 2,
        base: 3,
        linea: 4,
        scroll: 5,
        zksync: 6,
        blast: 7,
        bob: 8,
        boba: 9,
        fraxtal: 10,
        abstract: 11,
        adi: 12,
        aevo: 13,
        ancient8: 14,
        arenaz: 15,
        aztec: 16,
        camp: 17,
        codex: 18,
        fuel: 19,
        gravity: 20,
      },
    },
    {
      label: "Large counts · 10, 99, 100, and 999 transactions",
      amounts: { arbitrum: 10, optimism: 99, base: 100, linea: 999 },
    },
  ];

export default function RollupPreview() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 text-slate-900 dark:text-slate-100">
      <h1 className="text-2xl font-bold">Rollup icon examples</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Sample counts. Hover over a group or use Tab to expand it. Hover over or
        select +N to see all rollup names and transaction counts.
      </p>
      <div className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-900">
        {examples.map(({ label, amounts }) => (
          <section
            key={label}
            className="flex min-h-24 flex-wrap items-center justify-between gap-6 px-6 py-5"
          >
            <h2 className="text-sm">{label}</h2>
            <RollupBadgeGroup amounts={amounts} />
          </section>
        ))}
      </div>
    </main>
  );
}

export function getServerSideProps() {
  return process.env.NODE_ENV === "development"
    ? { props: {} }
    : { notFound: true };
}
