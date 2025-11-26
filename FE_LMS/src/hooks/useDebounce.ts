import { useState, useEffect } from "react";

const useDebounce = <T>(value: T, delay: number) => {
  const [debounceValue, setDebounceValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebounceValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debounceValue as T;
};

export default useDebounce;
