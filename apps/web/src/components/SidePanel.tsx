import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { animated, useSpring } from "@react-spring/web";
import cn from "classnames";

type SidePanelContextValues = {
  status: "opened" | "closed" | "opening" | "closing";
};

const SidePanelContext = createContext<SidePanelContextValues | null>(null);

export function SidePanel({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const [status, setStatus] = useState<SidePanelContextValues["status"]>(
    open ? "opened" : "closed"
  );
  const props = useSpring({
    from: { left: "-100%" },
    left: open ? "0" : "-100%",
    onStart() {
      setStatus(open ? "opening" : "closing");
    },
    onRest() {
      setStatus(open ? "opened" : "closed");
    },
  });

  // Closes the side panel when the "Escape" key is pressed
  useEffect(() => {
    const keydownHandler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", keydownHandler);

    return () => {
      document.removeEventListener("keydown", keydownHandler);
    };
  }, [onClose]);

  return (
    <>
      <Overlay show={open} onClose={onClose} />

      <animated.div
        className={`fixed top-0 z-50 h-full w-[80%] max-w-[400px] overflow-y-auto border-r border-black border-opacity-20 bg-background-light dark:bg-background-dark`}
        style={props}
      >
        <SidePanelContext.Provider value={{ status }}>
          {children}
        </SidePanelContext.Provider>
      </animated.div>
    </>
  );
}

export function useSidePanel() {
  const value = useContext(SidePanelContext);

  if (!value) {
    throw new Error("useSidePanel() must be used within a SidePanel component");
  }

  return value;
}

function Overlay({ show, onClose }: { show: boolean; onClose: () => void }) {
  const props = useSpring({
    from: { opacity: 0 },
    to: { opacity: show ? 0.8 : 0 },
  });

  return (
    <animated.div
      className={cn("fixed left-0 top-0 z-10 h-full w-full bg-black", {
        "pointer-events-none": !show,
      })}
      style={props}
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
