import { useEffect, useState, useCallback, useRef } from 'react';

interface Options<T extends string> {
  enabled: boolean;
  initialFocusKey?: T;
}

/**
 * Keyboard navigation using data-field attributes on DOM elements.
 * Enter => next field, Shift+Enter => previous, Tab works natively.
 * Enter never submits the form.
 */
export function useKeyboardNav<T extends string>({ enabled, initialFocusKey }: Options<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const orderRef = useRef<T[]>([]);
  const [activeKey, setActiveKey] = useState<T | null>(null);

  const setOrder = useCallback((keys: T[]) => {
    orderRef.current = keys;
  }, []);

  const getEl = useCallback((key: T): HTMLElement | null => {
    const container = containerRef.current;
    if (!container) return null;
    return container.querySelector<HTMLElement>(`[data-field="${key}"]`);
  }, []);

  const focusField = useCallback(
    (key: T) => {
      const el = getEl(key);
      if (el) {
        el.focus();
        if (typeof (el as HTMLInputElement).select === 'function') {
          (el as HTMLInputElement).select();
        }
        setActiveKey(key);
      }
    },
    [getEl],
  );

  const move = useCallback(
    (dir: 1 | -1, fromKey?: T) => {
      const order = orderRef.current;
      if (order.length === 0) return;
      const start = fromKey ?? activeKey ?? order[0];
      let idx = order.indexOf(start);
      if (idx === -1) idx = dir === 1 ? 0 : order.length - 1;
      const next = (idx + dir + order.length) % order.length;
      focusField(order[next]);
    },
    [activeKey, focusField],
  );

  // Global keydown handler on the container
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (!enabled) return;
      const target = e.target as HTMLElement;
      const field = target.getAttribute('data-field') as T | null;
      if (!field) return;

      if (e.key === 'Enter') {
        // Always prevent form submission and move to next/prev field
        e.preventDefault();
        if (e.shiftKey) {
          move(-1, field);
        } else {
          move(1, field);
        }
        return;
      }
    },
    [enabled, move],
  );

  // Autofocus initial field
  useEffect(() => {
    if (initialFocusKey) {
      const t = setTimeout(() => focusField(initialFocusKey), 50);
      return () => clearTimeout(t);
    }
  }, [initialFocusKey, focusField]);

  return { containerRef, setOrder, focusField, move, handleKeyDown, activeKey };
}
