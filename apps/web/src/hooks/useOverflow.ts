import { useEffect, useState } from "react";

const useOverflow = (
  containerRef: React.RefObject<HTMLDivElement>,
  innerRef: React.RefObject<HTMLDivElement>
) => {
  const [isOverflowing, setIsOverflowing] = useState<boolean>(false);

  useEffect(() => {
    const container = containerRef.current;
    const inner = innerRef.current;

    if (!container || !inner) return;

    const resizeObserver = new ResizeObserver(() => {
      setIsOverflowing(inner.scrollWidth > container.clientWidth);
    });

    resizeObserver.observe(inner);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef, innerRef]);

  return isOverflowing;
};

export default useOverflow;
