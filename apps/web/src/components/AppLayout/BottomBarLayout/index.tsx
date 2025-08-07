import React from "react";

import { BlobscanSocialLinks } from "~/components/BlobscanSocialLinks";
import { BlobscanVersionInfo } from "~/components/BlobscanVersionInfo";
import { Copyable } from "~/components/Copyable";
import { Indicator } from "~/components/Indicator";
import { SyncIndicators } from "~/components/Indicators/SyncIndicators";
import { Link } from "~/components/Link";
import { shortenHash } from "~/utils";

const DONATION_ADDRESS = "0xfAdE78086109F1D827a5caD956cd26D10BE64510";

export const BottomBarLayout = () => {
  return (
    <div className="flex flex-col items-center justify-center p-2 text-xs">
      <div className="mt-4 flex flex-col items-center gap-2 sm:mt-8">
        <BlobscanSocialLinks />
        <div className="max-w-lg text-center text-contentTertiary-light dark:text-contentTertiary-dark">
          Blobscan is the first open-source block explorer for the{" "}
          <Link href="https://www.eip4844.com/" isExternal>
            EIP-4844
          </Link>{" "}
          shard blob transactions, providing the necessary infrastructure to
          scale Ethereum.
        </div>
        <div className="my-2.5">
          <SyncIndicators />
        </div>
        <div className="flex gap-1">
          <Indicator
            name="Support us with a donation"
            value={
              <div className="flex items-center gap-1.5">
                <Copyable value={DONATION_ADDRESS} tooltipText="Copy Address">
                  <span className="">{shortenHash(DONATION_ADDRESS, 8)}</span>
                </Copyable>
                ❤️
              </div>
            }
          />
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
