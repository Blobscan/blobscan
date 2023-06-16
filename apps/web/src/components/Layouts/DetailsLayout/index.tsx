import { type FC, type ReactNode } from "react";

import { Header } from "~/components/Header";
import { InfoGrid, type InfoGridProps } from "~/components/InfoGrid";
import { SectionCard } from "../../Cards/SectionCard";
import { Link } from "../../Link";

type DetailsLayoutProps = {
  children?: ReactNode;
  header: ReactNode;
  fields: InfoGridProps["fields"];
  externalLink?: string;
};

export const DetailsLayout: FC<DetailsLayoutProps> = function ({
  header,
  externalLink,
  fields,
}) {
  return (
    <>
      <Header>{header}</Header>
      <SectionCard
        header={
          <div className="flex flex-col justify-between gap-1 md:flex-row">
            <div className="truncate">Overview</div>
            {externalLink && (
              <div className="text-sm font-normal">
                <Link href={externalLink} isExternal>
                  View in Explorer
                </Link>
              </div>
            )}
          </div>
        }
      >
        <InfoGrid fields={fields} />
      </SectionCard>
    </>
  );
};
