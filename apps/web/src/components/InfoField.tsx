import type { FC, ReactNode } from "react";

import { HelpIcon } from "~/components/HelpIcon";

type InfoFieldProps = {
  children: ReactNode;
  description: ReactNode;
};

export const InfoField: FC<InfoFieldProps> = ({ children, description }) => {
  return (
    <div className="flex flex-row items-center gap-2">
      <HelpIcon description={description} />
      {children}
    </div>
  );
};
