import type { FC } from "react";

import { ExternalAppLinks } from "~/components/ExternalAppLinks";

export const BottomBar: FC = function () {
  return (
    <div>
      <ExternalAppLinks />
      <span className="text-sm text-contentSecondary-light dark:text-contentSecondary-dark">
        Blobscan @ 2023 | v1.0.0
      </span>
    </div>
  );
};
