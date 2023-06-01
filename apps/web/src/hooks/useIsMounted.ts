import { useEffect, useState } from "react";

export const useIsMounted = function () {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
};
