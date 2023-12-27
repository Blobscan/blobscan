import React from "react";

import { ExplorerDetails } from "../../ExplorerDetails";

export const BottomBarLayout = () => {
  return (
    <div className="mx-auto flex flex-col items-center justify-center space-y-4 p-2">
      <div className="md:hidden">
        <ExplorerDetails />
      </div>
      <div>
        <span className="text-sm text-contentSecondary-light dark:text-contentSecondary-dark">
          Blobscan @ 2023 | v1.0.0
        </span>
      </div>
    </div>
  );
};
