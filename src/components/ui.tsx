"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { haptic } from "@/lib/haptics";

export function Screen({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <main className={clsx("mx-auto w-full max-w-md px-4 py-6 sm:py-10", className)}>{children}</main>
  );
}

export function Card({
  children,
  className,
  interactive,
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div className={clsx("card p-5", interactive && "transition hover:-translate-y-0.5 hover:shadow-pop", className)}>
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "success" }) {
  const cls = variant === "ghost" ? "btn-ghost" : variant === "success" ? "btn-success" : "btn-primary";
  return (
    <button
      className={clsx(cls, className)}
      onClick={(e) => {
        haptic(12);
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export function Pill({
  children,
  color,
  className,
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={clsx("inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold", className)}
      style={color ? { backgroundColor: `${color}1f`, color } : undefined}
    >
      {children}
    </span>
  );
}

// Animated progress bar with a moving shine, coloured per department.
export function ProgressBar({ value, color, className }: { value: number; color: string; className?: string }) {
  return (
    <div className={clsx("relative h-3 overflow-hidden rounded-full bg-ink/5", className)}>
      <motion.div
        className="relative h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.round(value * 100)}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      >
        {value > 0.04 && (
          <span className="absolute inset-y-0 left-0 w-1/3 animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        )}
      </motion.div>
    </div>
  );
}
