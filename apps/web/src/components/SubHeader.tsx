import type { FC, ReactNode } from "react";

export const SubHeader: FC<{ children: ReactNode }> = function ({ children }) {
  return <div className="truncate text-xl font-semibold">{children}</div>;
};
