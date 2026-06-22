"use client";

import clsx from "clsx";

// Tiny presentational kit so pages stay readable. Nothing fancy.

export function Screen({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <main className={clsx("mx-auto w-full max-w-md px-4 py-6 sm:py-10", className)}>{children}</main>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("card p-5", className)}>{children}</div>;
}

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }) {
  return (
    <button className={clsx(variant === "primary" ? "btn-primary" : "btn-ghost", className)} {...props}>
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
      className={clsx("inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold", className)}
      style={color ? { backgroundColor: `${color}1a`, color } : undefined}
    >
      {children}
    </span>
  );
}
