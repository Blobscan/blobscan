import { XMarkIcon } from "@heroicons/react/24/solid";

import { Button } from "../Button";
import { ExpandibleMenuItem, MenuItem } from "./data";

export function MobileMenu({
  data,
  closeMenu,
  open,
}: {
  data: Array<MenuItem | ExpandibleMenuItem>;
  closeMenu: () => void;
  open: boolean;
}) {
  return (
    <div
      className="fixed left-0 top-0 z-10 h-full w-full overflow-y-auto bg-background-light p-4 shadow dark:bg-background-dark"
      style={{
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.6s",
      }}
    >
      <div>
        <Button variant="icon" onClick={closeMenu} icon={<XMarkIcon />} />
        <div className="flex flex-col justify-center gap-4 p-2">
          {data.map((item) => (
            <MobileMenuItem {...item} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileMenuItem(item: MenuItem | ExpandibleMenuItem) {
  if (item.type === "single") {
    return (
      <a
        className="flex cursor-pointer items-center gap-1 duration-200 hover:text-iconHighlight-light hover:dark:text-iconHighlight-dark"
        href={item.href}
      >
        <div className="h-4 w-4">{item.icon}</div>
        {item.label}
      </a>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-1">
        <div className="h-4 w-4">{item.icon}</div>
        {item.label}
      </div>
      <div className="flex flex-col gap-2 p-4">
        {item.items.map((subItem) => (
          <a
            href={subItem.href}
            className="duration-200 hover:text-iconHighlight-light hover:dark:text-iconHighlight-dark"
          >
            {subItem.label}
          </a>
        ))}
      </div>
    </div>
  );
}
