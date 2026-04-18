import { useEffect, useRef, useState } from "react";

export const useMinVisibleLoading = (isActive: boolean, minimumDurationMs = 700) => {
  const [visible, setVisible] = useState(false);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (isActive) {
      startedAtRef.current = Date.now();
      setVisible(true);
      return () => {
        if (timer) {
          clearTimeout(timer);
        }
      };
    }

    if (!visible) {
      startedAtRef.current = null;
      return () => {
        if (timer) {
          clearTimeout(timer);
        }
      };
    }

    const startedAt = startedAtRef.current ?? Date.now();
    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(minimumDurationMs - elapsed, 0);

    timer = setTimeout(() => {
      setVisible(false);
      startedAtRef.current = null;
    }, remaining);

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [isActive, minimumDurationMs, visible]);

  return visible;
};

export const useEnterSkeletonLoading = (isLoading: boolean, minimumDurationMs = 1000) => {
  const mountedAtRef = useRef(Date.now());
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (isLoading) {
      setVisible(true);
      return () => {
        if (timer) {
          clearTimeout(timer);
        }
      };
    }

    const elapsed = Date.now() - mountedAtRef.current;
    const remaining = Math.max(minimumDurationMs - elapsed, 0);

    timer = setTimeout(() => {
      setVisible(false);
    }, remaining);

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [isLoading, minimumDurationMs]);

  return visible;
};
