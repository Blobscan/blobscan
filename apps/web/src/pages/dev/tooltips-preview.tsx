import { HelpIcon } from "~/components/HelpIcon";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/Tooltip";

export default function TooltipsPreview() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <h1 className="text-2xl font-bold">Tooltip preview</h1>
      <p className="mt-2 text-sm text-contentSecondary-light dark:text-contentSecondary-dark">
        Hover over a label or use Tab to show its tooltip. Move away to see the
        exit animation. Press Escape to close it.
      </p>
      <dl className="mt-32 divide-y divide-border-light rounded-lg border border-border-light bg-surface-light px-6 dark:divide-border-dark dark:border-border-dark dark:bg-surface-dark">
        <div className="flex items-center justify-between gap-4 py-6">
          <dt>
            <Tooltip>
              <TooltipTrigger className="rounded underline decoration-dotted underline-offset-4">
                Blob gas used
              </TooltipTrigger>
              <TooltipContent heading="Blob gas used">
                Total blob gas used in this block. Each blob uses 131,072 blob
                gas.
              </TooltipContent>
            </Tooltip>
          </dt>
          <dd className="tabular-nums">393,216</dd>
        </div>
        <div className="flex items-center justify-between gap-4 py-6">
          <dt className="flex items-center gap-2">
            Blob count
            <HelpIcon description="Number of blobs included in this block." />
          </dt>
          <dd className="tabular-nums">3</dd>
        </div>
        <div className="flex items-center justify-between gap-4 py-6">
          <dt>Blob gas price</dt>
          <dd>
            <Tooltip>
              <TooltipTrigger className="rounded tabular-nums underline decoration-dotted underline-offset-4">
                &lt;0.0001 Gwei
              </TooltipTrigger>
              <TooltipContent>0.000000001 Gwei</TooltipContent>
            </Tooltip>
          </dd>
        </div>
      </dl>
      <p className="mt-4 text-xs text-contentSecondary-light dark:text-contentSecondary-dark">
        Sample data. Entry: 200 ms. Exit: 120 ms. No hover delay.
      </p>
    </main>
  );
}

export function getServerSideProps() {
  return process.env.NODE_ENV === "development"
    ? { props: {} }
    : { notFound: true };
}
