import { useEffect, useState } from 'react';

import { debounce } from '@/lib/utils';

export const useDebouncedValue = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const setDebounced = debounce((next: T) => setDebouncedValue(next), delay);

  useEffect(() => {
    setDebounced(value);
  }, [value, setDebounced]);

  return debouncedValue;
};
