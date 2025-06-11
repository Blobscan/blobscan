import type { FC } from "react";
import { useRef } from "react";

import { useHover } from "~/hooks/useHover";
import { formatFiat } from "~/utils";

type FiatDisplayProps = {
  amount: number | string;
  currency?: string;
};

export const FiatDisplay: FC<FiatDisplayProps> = function ({
  amount,
  currency = "USD",
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isHovered = useHover(containerRef);

  const formattedFullAmount = formatFiat(amount, {
    currency,
    maximumFractionDigits: 18,
  });
  const currencySymbol = formattedFullAmount.slice(0, 1);
  const onlyAmount = formattedFullAmount.slice(1);
  const [intPart, decPart = ""] = onlyAmount.split(".");
  const firstDecDigits = decPart.slice(0, 2);
  const formattedDecPart = decPart.slice(
    0,
    decPart.startsWith("00") && decPart.length > 2
      ? decPart.search(/[^0]/) + 1
      : 2
  );

  return (
    <span ref={containerRef}>
      {`${currencySymbol}${intPart}.${
        isHovered ? formattedDecPart : firstDecDigits
      }`}
    </span>
  );
};
