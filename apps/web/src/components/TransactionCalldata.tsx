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
            className="max-h-80 w-full resize-y overflow-auto rounded-md border border-primary-200 bg-transparent p-3 font-mono text-sm dark:border-primary-700"
          />
        </div>
      )}
    </>
  );
}
