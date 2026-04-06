import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/20/solid";

import { useEnv } from "~/providers/Env";

export default function Banner() {
  const { env } = useEnv();
  const [visible, setVisible] = useState(true);

  const bannerText = env?.PUBLIC_BANNER_TEXT;
  const linkText = env?.PUBLIC_BANNER_LINK_TEXT;
  const linkUrl = env?.PUBLIC_BANNER_LINK_URL;

  if (!bannerText || !visible) {
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
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-sm leading-6 text-content-light dark:text-content-dark">
          {bannerText}
        </p>
        {linkUrl && (
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-none rounded-full bg-primary-400 px-3.5 py-1 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400"
          >
            {linkText ?? "Read more"}{" "}
            <span aria-hidden="true">&rarr;</span>
          </a>
        )}
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
