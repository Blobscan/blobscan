import { CopyToClipboard } from "./CopyToClipboard";

export function TransactionCalldata({ input }: { input?: string | null }) {
  return (
    <>
      {input == null ? (
        "Unavailable"
      ) : (
        <div className="relative min-w-0">
          <div className="absolute right-3 top-3 flex items-center gap-2 rounded bg-controlBackground-light px-1 dark:bg-background-dark">
            <span className="text-xs text-contentTertiary-light dark:text-contentTertiary-dark">
              {(input.length - 2) / 2} bytes
            </span>
            <CopyToClipboard value={input} tooltipText="Copy raw input" />
          </div>
          <textarea
            aria-label="Raw Input"
            readOnly
            value={input}
            rows={4}
            spellCheck={false}
            className="max-h-80 w-full resize-y overflow-auto rounded-md border border-border-light bg-controlBackground-light p-3 pt-10 font-mono text-sm text-content-light focus:border-border-light focus:ring-1 focus:ring-border-light dark:border-border-dark dark:bg-background-dark dark:text-content-dark dark:focus:border-border-dark dark:focus:ring-border-dark"
          />
        </div>
      )}
    </>
  );
}
