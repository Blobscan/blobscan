import { Card } from "./Cards/Card";
import { CopyToClipboard } from "./CopyToClipboard";

export function TransactionCalldata({ input }: { input?: string | null }) {
  return (
    <Card header="Calldata">
      {input == null ? (
        "Unavailable"
      ) : (
        <div className="min-w-0 space-y-3">
          <div className="flex items-center gap-2">
            <span>{(input.length - 2) / 2} bytes</span>
            <CopyToClipboard value={input} tooltipText="Copy calldata" />
          </div>
          <pre
            aria-label="Transaction calldata"
            className="max-h-80 overflow-auto whitespace-pre-wrap break-all font-mono text-sm"
          >
            {input}
          </pre>
        </div>
      )}
    </Card>
  );
}
