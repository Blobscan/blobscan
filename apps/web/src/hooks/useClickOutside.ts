import { useEffect, useState } from "react";
import type { RefObject } from "react";

function assertIsNode(e: EventTarget | null): asserts e is Node {
  if (!e || !("nodeType" in e)) {
    throw new Error(`Node expected`);
  }
}

export function useClickOutside<T extends HTMLElement>(ref: RefObject<T>) {
  const [clickOutside, setClickOutside] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      assertIsNode(event.target);

      setClickOutside(
        Boolean(ref.current && !ref.current.contains(event.target))
      );
    }
    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref]);

  return clickOutside;
}
