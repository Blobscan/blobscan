import type { FC, ReactNode } from "react";

import { Header } from "~/components/Header";
import { InfoGrid } from "~/components/InfoGrid";
import type { InfoGridProps } from "~/components/InfoGrid";
import { Card } from "../Cards/Card";
import { Link } from "../Link";

export type DetailsLayoutProps = {
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
      <Card
        header={
          <div className="flex flex-row justify-between gap-1">
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
      </Card>
    </>
  );
};
