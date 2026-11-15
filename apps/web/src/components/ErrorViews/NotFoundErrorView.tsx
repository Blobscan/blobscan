import type { FC, ReactNode } from "react";
import Link from "next/link";

import { ErrorIllustrationLayout } from "./ErrorIllustrationLayout";
import { SearchingBlob } from "./SearchingBlob";

export interface NotFoundErrorViewProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export const NotFoundErrorView: FC<NotFoundErrorViewProps> = function ({
  title,
  description,
  action,
}) {
  return (
    <ErrorIllustrationLayout
      code={404}
      title={title}
      description={description}
      image={<SearchingBlob />}
      action={
        action ?? (
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded bg-accent-light px-5 py-3 text-sm font-semibold text-accentContent-light transition-colors hover:bg-accentHighlight-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-light dark:bg-accent-dark dark:text-accentContent-dark dark:hover:bg-accentHighlight-dark"
          >
            Back to homepage
          </Link>
        )
      }
    />
  );
};
