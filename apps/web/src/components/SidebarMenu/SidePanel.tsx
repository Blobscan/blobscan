import type { ReactNode } from "react";
import { useEffect } from "react";

export function SidePanel({
  open,
  setOpen,
  children,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  children: ReactNode;
}) {
  // Hides the scrollbar when the side panel is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [open]);

  // Closes the side panel when the "Escape" key is pressed
  useEffect(() => {
    const keydownHandler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", keydownHandler);

    return () => {
      document.removeEventListener("keydown", keydownHandler);
    };
  }, [setOpen]);

  return (
    <>
      <MobileMenuBackground show={open} onClose={() => setOpen(false)} />
      <div
        className={`fixed left-0 top-0 z-50 h-full w-[80%] overflow-y-auto border-r border-black border-opacity-20 bg-background-light duration-300 dark:bg-background-dark ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {children}
      </div>
    </>
  );
}

function MobileMenuBackground({
  show,
  onClose,
}: {
  show: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className={`fixed left-0 top-0 z-10 h-full w-full bg-black ${
        show ? "opacity-80" : "pointer-events-none opacity-0"
      }`}
      onClick={onClose}
      tabIndex={0}
      role="button"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          onClose();
        }
      }}
    />
  );
}
