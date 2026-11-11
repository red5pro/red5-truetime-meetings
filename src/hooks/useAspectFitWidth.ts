import { RefObject, useEffect, useState } from 'react';

/**
 * Width of the largest box with the given aspect ratio (width / height) that fits inside the
 * element, kept up to date as it resizes. Null until the element has been measured.
 */
export const useAspectFitWidth = (
  ref: RefObject<HTMLElement | null>,
  aspectRatio: number,
): number | null => {
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;

    const measure = (): void => {
      const { clientWidth, clientHeight } = element;
      if (clientWidth === 0 || clientHeight === 0) return;
      const fitted = Math.floor(Math.min(clientWidth, clientHeight * aspectRatio));
      setWidth((previous) => (previous === fitted ? previous : fitted));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, aspectRatio]);

  return width;
};
