import { type FC, type ReactNode } from "react";

import { SectionCard } from "./Cards/SectionCard";
import { Link } from "./Link";

export const PageLayout: FC<{ children: ReactNode }> = function ({ children }) {
  return <div className="mx-auto w-9/12 space-y-12">{children}</div>;
};

type DetailsLayoutProps = {
  children: ReactNode;
  title: string;
  externalLink?: string;
};

export const DetailsLayout: FC<DetailsLayoutProps> = function ({
  children,
  title,
  externalLink,
}) {
  return (
    <SectionCard
      header={
        <div className="flex flex-col justify-between gap-1 md:flex-row">
          <div>{title}</div>
          {externalLink && (
            <div className="text-base">
              <Link href={externalLink} isExternal>
                View in Etherscan
              </Link>
            </div>
          )}
        </div>
      }
    >
      {children}
    </SectionCard>
  );
};
