import { CopyToClipboard } from "./CopyToClipboard";

export function TransactionCalldata({ input }: { input?: string | null }) {
  return (
    <>
      {input == null ? (
        "Unavailable"
      ) : (
        <div className="min-w-0 space-y-3">
          <div className="flex items-center gap-2">
            <span>{(input.length - 2) / 2} bytes</span>
            <CopyToClipboard value={input} tooltipText="Copy input data" />
          </div>
          <textarea
            aria-label="Input Data"
            readOnly
            value={input}
            rows={4}
            spellCheck={false}
            className="max-h-80 w-full resize-y overflow-auto rounded-md border border-border-light bg-controlBackground-light p-3 font-mono text-sm text-content-light focus:border-border-light focus:ring-1 focus:ring-border-light dark:border-border-dark dark:bg-background-dark dark:text-content-dark dark:focus:border-border-dark dark:focus:ring-border-dark"
          />
        </div>
      )}
    </>
  );
}
