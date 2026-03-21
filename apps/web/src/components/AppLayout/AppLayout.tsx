import cn from "classnames";

import { useIsHomepage } from "~/hooks/useIsHomePage";
import { BottomBarLayout } from "./BottomBarLayout";
import { TopBarLayout } from "./TopBarLayout";

interface LayoutProps {
  children: React.ReactNode;
  hidden?: boolean;
  variant?: string;
}

const AppLayout = ({ children, hidden }: LayoutProps) => {
  const isHomepage = useIsHomepage();

  return (
    <div className={cn("flex min-h-screen flex-col", { invisible: hidden })}>
      <TopBarLayout />
      <main
        className={cn("container mx-auto grow", {
          "mb-14 mt-14": isHomepage,
          "mb-12  mt-10  sm:mb-16 sm:mt-20": !isHomepage,
        })}
      >
        <div className="mx-auto flex w-11/12 flex-col gap-8">
          {children}
        </div>
      </main>
      <BottomBarLayout />
    </div>
  );
};

export default AppLayout;
