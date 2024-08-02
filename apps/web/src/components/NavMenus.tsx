import { NavItemComponent } from "./Menu";
import { SidebarMenu } from "./SidebarMenu/SidebarMenu";
import { MENU_ITEMS } from "./content";

export const NavMenusSection: React.FC = () => {
  return (
    <div className="flex items-center justify-between">
      <SidebarMenu />

      <div className="hidden items-center gap-4 md:flex">
        {MENU_ITEMS.map((item) => (
          <NavItemComponent {...item} key={item.label} />
        ))}
      </div>
    </div>
  );
};
