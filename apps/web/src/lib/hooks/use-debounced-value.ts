import { useEffect, useMemo, useState } from 'react';

import { debounce } from '@/lib/utils';

export const useDebouncedValue = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const setDebounced = useMemo(
    () => debounce((next: T) => setDebouncedValue(next), delay),
    [delay],
  );

  useEffect(() => {
    setDebounced(value);
  }, [value, setDebounced]);

  return debouncedValue;
};
