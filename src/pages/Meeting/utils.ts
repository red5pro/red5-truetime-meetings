// Utility function for debouncing
export const debounce = <T extends (...args: any[]) => any>(fn: T, ms: number) => {
  let timer: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, ms);
  };
};
