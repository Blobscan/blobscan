import { type ReactNode } from "react";

type TopBarSurfaceProps = {
  children: ReactNode;
};

export const TopBarSurface: React.FC<TopBarSurfaceProps> = function ({
  children,
}) {
  return (
    <nav
      className={`w-full border-b border-b-border-light bg-surface-light px-4 py-3 dark:border-b-border-dark dark:bg-surface-dark`}
    >
      {children}
    </nav>
  );
};
