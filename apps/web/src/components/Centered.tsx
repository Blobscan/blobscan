import { type FC, type ReactNode } from "react";

export const Centered: FC<{ children: ReactNode }> = function ({ children }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      {children}
    </div>
  );
};
