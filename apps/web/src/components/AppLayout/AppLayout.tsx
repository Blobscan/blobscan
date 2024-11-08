import cn from "classnames";

import { useIsHomepage } from "~/hooks/useIsHomePage";
import { BottomBarLayout } from "./BottomBarLayout";
import { TopBarLayout } from "./TopBarLayout";

interface LayoutProps {
  children: React.ReactNode;
  variant?: string;
}

const AppLayout = ({ children }: LayoutProps) => {
  const isHomepage = useIsHomepage();

  return (
    <div className="flex min-h-screen flex-col">
      <TopBarLayout />
      <main
        className={cn("container mx-auto grow", {
          "mt-14": isHomepage,
          "mt-8  sm:mb-16 sm:mt-20": !isHomepage,
        })}
      >
        <div className="mx-auto flex w-11/12 flex-col gap-8">{children}</div>
      </main>
      <BottomBarLayout />
    </div>
  );
};

export default AppLayout;
