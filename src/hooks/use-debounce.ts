"use client";

import { useEffect, useState } from "react";

/**
 * Debounces a value by the specified delay.
 * Useful for search inputs to avoid firing on every keystroke.
 *
 * @example
 * const debouncedSearch = useDebounce(searchQuery, 300);
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
