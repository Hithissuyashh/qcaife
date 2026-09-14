import { useEffect, useState } from "react";

/**
 * True only when decorative motion should run:
 * the user has not requested reduced motion AND the tab is visible.
 */
export function useMotionActive() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");

    const sync = () => {
      setActive(!query.matches && document.visibilityState === "visible");
    };

    sync();
    query.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      query.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return active;
}
