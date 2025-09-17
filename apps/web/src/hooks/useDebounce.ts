import { useEffect, useState } from "react";

// Hook from https://usehooks-ts.com/react-hook/use-debounce
export function useDebounce<T>(
  value: T,
  delay?: number
): { value: T; isDebouncing: boolean } {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return { value: debouncedValue, isDebouncing: debouncedValue !== value };
}
