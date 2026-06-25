export const copyToClipboard = async (text: string) => {
  await navigator.clipboard.writeText(text);
};

export const debounce = <T extends (...args: Parameters<T>) => void>(fn: T, delay: number) => {
  let timer: ReturnType<typeof setTimeout> | undefined;

  return (...args: Parameters<T>) => {
    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => fn(...args), delay);
  };
};
