"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";

type NavCtx = { start: () => void; active: boolean };

const Ctx = createContext<NavCtx>({ start: () => {}, active: false });

/** Call `start()` right before `router.push(...)` to show the top bar. */
export const useNavProgress = () => useContext(Ctx);

export function NavProgressProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [width, setWidth] = useState(0);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef<string | null>(null);

  const clearTick = () => {
    if (tick.current) {
      clearInterval(tick.current);
      tick.current = null;
    }
  };

  const start = useCallback(() => {
    startedAt.current = pathname;
    setActive(true);
    setWidth(8);
    clearTick();
    // Creep toward 90% so it always feels alive while the route resolves.
    tick.current = setInterval(() => {
      setWidth((w) => (w < 90 ? w + (90 - w) * 0.14 : w));
    }, 180);
  }, [pathname]);

  // Complete the bar once the pathname actually changes.
  useEffect(() => {
    if (!active) return;
    if (startedAt.current !== null && pathname === startedAt.current) return;
    clearTick();
    setWidth(100);
    const t = setTimeout(() => {
      setActive(false);
      setWidth(0);
    }, 320);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Safety: never let the bar hang forever if navigation stalls.
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => {
      clearTick();
      setWidth(100);
      setTimeout(() => {
        setActive(false);
        setWidth(0);
      }, 320);
    }, 8000);
    return () => clearTimeout(t);
  }, [active]);

  useEffect(() => () => clearTick(), []);

  return (
    <Ctx.Provider value={{ start, active }}>
      {/* Top progress bar */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5"
        style={{ opacity: active ? 1 : 0, transition: "opacity 200ms ease" }}
      >
        <div
          className="h-full brand-mark shadow-[0_0_12px_2px_rgba(244,63,94,0.6)]"
          style={{
            width: `${width}%`,
            transition: "width 180ms ease-out",
          }}
        />
        {/* indeterminate sheen while creeping */}
        {active && width < 100 && (
          <div className="absolute inset-y-0 left-0 w-full overflow-hidden">
            <div
              className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent"
              style={{ animation: "nprogress-indeterminate 1.1s ease-in-out infinite" }}
            />
          </div>
        )}
      </div>
      {children}
    </Ctx.Provider>
  );
}
