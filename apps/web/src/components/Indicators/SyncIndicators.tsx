import type { FC } from "react";

import { useAppState } from "~/providers/AppState";
import { formatNumber } from "~/utils";
import type { IndicatorProps } from "../Indicator";
import { Indicator } from "../Indicator";

export const SyncIndicators: FC = function () {
  const { appState } = useAppState();
  const state = appState?.syncState;

  const items: IndicatorProps[] = [
    {
      name: "Last synced slot",
      value: state ? formatNumber(state.lastUpperSyncedSlot ?? 0) : undefined,
    },
  ];

  return (
    <div className="flex flex-col items-center gap-1 text-xs md:flex-row md:gap-2.5">
      {items.map((i) => (
        <Indicator key={i.name} {...i} />
      ))}
    </div>
  );
};
