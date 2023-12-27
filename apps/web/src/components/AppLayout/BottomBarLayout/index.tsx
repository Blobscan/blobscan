import React from "react";

import { ExplorerDetails } from "../../ExplorerDetails";
import { BottomBar } from "./BottomBar";

export const BottomBarLayout = () => {
  return (
    <div className="mx-auto flex flex-col items-center justify-center space-y-4 p-2">
      <div className="md:hidden">
        <ExplorerDetails />
      </div>
      <BottomBar />
    </div>
  );
};
