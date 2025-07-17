import type { FC, ReactNode } from "react";

import { Header } from "~/components/Header";
import { InfoGrid } from "~/components/InfoGrid";
import type { InfoGridProps } from "~/components/InfoGrid";
import type { ExplorerResource } from "~/hooks/useExternalExplorers";
import { useExternalExplorers } from "~/hooks/useExternalExplorers";
import { Card } from "../Cards/Card";
import { Icon } from "../Icon";
import { Link } from "../Link";
import { Separator } from "../Separator";

export type DetailsLayoutProps = {
  children?: ReactNode;
  header: ReactNode;
  fields: InfoGridProps["fields"];
  resource?: ExplorerResource;
};

export const DetailsLayout: FC<DetailsLayoutProps> = function ({
  header,
  fields,
  resource,
}) {
  const { buildResourceUrl, explorers } = useExternalExplorers("execution");

  return (
    <>
      <Header>{header}</Header>
      <Card
        header={
          <div className="flex flex-row justify-between gap-1">
            <div className="truncate">Overview</div>
            {resource && explorers.length && (
              <div className="flex items-center gap-2 text-sm font-normal text-content-light dark:text-contentSecondary-dark">
                <div>View On:</div>
                <div className="flex items-center gap-1">
                  {explorers.map((e, i) => {
                    const { icon, label } = e;

                    return (
                      <div key={label} className="flex items-center gap-1">
                        {i > 0 && <Separator />}
                        {icon && <Icon src={icon} size="lg" />}

                        <Link
                          href={buildResourceUrl(e.id, resource)}
                          isExternal
                        >
                          {label ?? "External Explorer"}
                        </Link>
                      </div>
                    );
                  })}
                </div>
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
