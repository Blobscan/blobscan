import { type FC, type ReactNode } from "react";

import { SectionCard } from "./Cards/SectionCard";
import { Link } from "./Link";

type DetailsLayoutProps = {
  children?: ReactNode;
  title: ReactNode;
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
          <div className="truncate">{title}</div>
          {externalLink && (
            <div className="text-base font-normal">
              <Link href={externalLink} isExternal>
                View in Explorer
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
