import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

export type PillNavItem = { label: string; to: string };

export function PillNav({
  items,
  activeHref,
  className,
  brand,
}: {
  items: readonly PillNavItem[];
  activeHref?: string;
  className?: string;
  brand?: React.ReactNode;
}) {
  return (
    <nav
      className={cn(
        "glass-tile flex items-center gap-1 rounded-full px-1.5 py-1.5",
        className,
      )}
    >
      {brand ? <div className="px-3 text-[0.95rem]">{brand}</div> : null}
      {items.map((item) => {
        const active = activeHref === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "group relative overflow-hidden rounded-full px-4 py-1.5 text-[0.8125rem] transition-colors duration-300",
              active ? "text-background" : "text-ink-faint hover:text-background",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "absolute inset-0 rounded-full bg-ink transition-transform duration-[420ms]",
                active
                  ? "scale-100"
                  : "origin-bottom scale-y-0 group-hover:scale-y-100",
              )}
              style={{ transitionTimingFunction: "cubic-bezier(0.22,0.61,0.24,1)" }}
            />
            <span className="relative">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}