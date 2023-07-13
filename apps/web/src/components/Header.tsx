import type { FC, ReactNode } from "react";

export const Header: FC<{ children: ReactNode }> = function ({ children }) {
  return <div className="truncate text-2xl font-bold">{children}</div>;
};
