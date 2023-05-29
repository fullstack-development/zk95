import { useCallback, useEffect, useRef } from 'react';

export function useClickOutside<E extends HTMLElement>(handler: () => void) {
  const ref = useRef<E>(null);

  const handleEvent = useCallback(
    (e: { target: EventTarget | null }) => {
      if (
        ref.current &&
        (e.target instanceof Node || e.target === null) &&
        !ref.current.contains(e.target)
      ) {
        handler();
      }
    },
    [handler]
  );

  useEffect(() => {
    if (window.PointerEvent) {
      document.addEventListener('pointerdown', handleEvent);
    } else {
      document.addEventListener('mousedown', handleEvent);
      document.addEventListener('touchstart', handleEvent);
    }

    return () => {
      if (window.PointerEvent) {
        document.removeEventListener('pointerdown', handleEvent);
      } else {
        document.removeEventListener('mousedown', handleEvent);
        document.removeEventListener('touchstart', handleEvent);
      }
    };
  }, [handleEvent]);

  return ref;
}
