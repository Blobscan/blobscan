import React from "react";

import { BlobscanSocialLinks } from "~/components/BlobscanSocialLinks";
import { BlobscanVersionInfo } from "~/components/BlobscanVersionInfo";
import { SyncIndicators } from "~/components/Indicators/SyncIndicators";
import { Link } from "~/components/Link";

export const BottomBarLayout = () => {
  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div className="mt-4 flex flex-col items-center gap-2 sm:mt-8">
        <BlobscanSocialLinks />
        <div className="max-w-lg text-center text-xs text-contentTertiary-light dark:text-contentTertiary-dark">
          Blobscan is the first open-source block explorer for the{" "}
          <Link href="https://www.eip4844.com/" isExternal>
            EIP-4844
          </Link>{" "}
          shard blob transactions, providing the necessary infrastructure to
          scale Ethereum.
        </div>
        <div className="my-1">
          <SyncIndicators />
        </div>
        <BlobscanVersionInfo />
        <div className="flex gap-2">
          <div className="text-sm text-contentTertiary-light dark:text-contentTertiary-dark">
            Blobscan © 2024-2025
          </div>
        </div>
      </div>
    </div>
  );
};
