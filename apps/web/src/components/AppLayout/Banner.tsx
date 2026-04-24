import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/20/solid";

import { Link } from "../Link";

export default function Banner() {
  const [visible, setVisible] = useState(true);

  if (!visible) {
    return null;
  }

  return (
    <div className="relative isolate flex items-center gap-x-6 overflow-hidden bg-primary-50 px-6 py-2.5 dark:bg-primary-900/30 sm:px-3.5 sm:before:flex-1">
      <div
        className="absolute left-[max(-7rem,calc(50%-52rem))] top-1/2 -z-10 -translate-y-1/2 transform-gpu blur-2xl"
        aria-hidden="true"
      >
        <div
          className="aspect-[577/310] w-[36.0625rem] bg-gradient-to-r from-[#ff80b5] to-[#9089fc] opacity-30"
          style={{
            clipPath:
              "polygon(74.8% 41.9%, 97.2% 73.2%, 100% 34.9%, 92.5% 0.4%, 87.5% 0%, 75% 28.6%, 58.5% 54.6%, 50.1% 56.8%, 46.9% 44%, 48.3% 17.4%, 24.7% 53.9%, 0% 27.9%, 11.9% 74.2%, 24.9% 54.1%, 68.6% 100%, 74.8% 41.9%)",
          }}
        />
      </div>
      <div
        className="absolute left-[max(45rem,calc(50%+8rem))] top-1/2 -z-10 -translate-y-1/2 transform-gpu blur-2xl"
        aria-hidden="true"
      >
        <div
          className="aspect-[577/310] w-[36.0625rem] bg-gradient-to-r from-[#ff80b5] to-[#9089fc] opacity-30"
          style={{
            clipPath:
              "polygon(74.8% 41.9%, 97.2% 73.2%, 100% 34.9%, 92.5% 0.4%, 87.5% 0%, 75% 28.6%, 58.5% 54.6%, 50.1% 56.8%, 46.9% 44%, 48.3% 17.4%, 24.7% 53.9%, 0% 27.9%, 11.9% 74.2%, 24.9% 54.1%, 68.6% 100%, 74.8% 41.9%)",
          }}
        />
      </div>
      <div className="flex flex-col items-center gap-y-1 text-sm">
        <div className="flex flex-wrap items-center gap-x-4">
          <p className="leading-6 text-content-light dark:text-content-dark">
            ⚡ Blobscan needs your support! We only have 6 months of runway.
          </p>
          <Link
            href="https://paragraph.com/@blobscan/blobscan-the-cost-of-archiving-ethereums-blob-data"
            isExternal
          >
            Read our latest blog post
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-x-4">
          <p className="leading-6 text-content-light dark:text-content-dark">
            The good news: we&apos;re part of the TheDAO Security Fund Quadratic
            Funding Round — every donation is amplified.
          </p>
          <Link
            href="https://qf.giveth.io/project/blobscan?roundId=16"
            isExternal
          >
            Donate on Giveth
          </Link>
        </div>
      </div>
      <div className="flex flex-1 justify-end">
        <button
          type="button"
          className="-m-3 p-3 focus-visible:outline-offset-[-4px]"
          onClick={() => setVisible(false)}
        >
          <span className="sr-only">Dismiss</span>
          <XMarkIcon
            className="h-5 w-5 text-contentSecondary-light dark:text-contentSecondary-dark"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
}
