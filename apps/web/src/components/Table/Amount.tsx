import { useEffect, useRef, useState } from "react";
import type { FC } from "react";

import { formatWei, prettyFormatWei } from "@blobscan/eth-format";

import { Tooltip, TooltipContent, TooltipTrigger } from "../Tooltip";

type TableAmountProps = {
  weiAmount: bigint;
};

/** Show the exact value only when the amount is below the limit or cut off. */
export const TableAmount: FC<TableAmountProps> = ({ weiAmount }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const fullAmount = formatWei(weiAmount, { toUnit: "Gwei", hideUnit: true });
  const amount =
    weiAmount > BigInt(0) && weiAmount < BigInt(100_000)
      ? "<0.0001"
      : prettyFormatWei(weiAmount, {
          toUnit: "Gwei",
          hideUnit: true,
          numberFormatOpts: {
            notation: "standard",
            maximumFractionDigits: 4,
          },
        });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function measure() {
      const element = container?.firstElementChild;
      setIsTruncated(!!element && element.scrollWidth > element.clientWidth);
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [amount]);

  const showTooltip = amount.startsWith("<") || isTruncated;
  const amountClassName = "block w-full truncate text-right tabular-nums";

  return (
    <div ref={containerRef}>
      {showTooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className={amountClassName}>
              {amount}
            </button>
          </TooltipTrigger>
          <TooltipContent>{fullAmount}</TooltipContent>
        </Tooltip>
      ) : (
        <span className={amountClassName}>{amount}</span>
      )}
    </div>
  );
};
