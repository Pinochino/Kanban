import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

export const useRouteTransitionLoading = (minimumDurationMs = 900) => {
  const location = useLocation();
  const [isTransitionLoading, setIsTransitionLoading] = useState(false);
  const previousRouteRef = useRef(`${location.pathname}${location.search}${location.hash}`);

  useEffect(() => {
    const currentRoute = `${location.pathname}${location.search}${location.hash}`;

    if (previousRouteRef.current === currentRoute) {
      return;
    }

    previousRouteRef.current = currentRoute;
    setIsTransitionLoading(true);

    const timer = setTimeout(() => {
      setIsTransitionLoading(false);
    }, minimumDurationMs);

    return () => {
      clearTimeout(timer);
    };
  }, [location.pathname, location.search, location.hash, minimumDurationMs]);

  return isTransitionLoading;
};
