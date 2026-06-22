"use client";

import clsx from "clsx";
import { motion } from "framer-motion";

// Full-width section with a centered, padded container.
export function Section({
  id,
  children,
  className,
  containerClassName,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}) {
  return (
    <section id={id} className={clsx("px-4 py-14 sm:py-20", className)}>
      <div className={clsx("mx-auto w-full max-w-5xl", containerClassName)}>{children}</div>
    </section>
  );
}

// Reveal-on-scroll wrapper (calm, meaningful motion — fires once).
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("space-y-2 text-center", className)}>
      {eyebrow && (
        <p className="text-xs font-bold uppercase tracking-widest text-brand">{eyebrow}</p>
      )}
      <h2 className="font-display text-3xl font-bold sm:text-4xl">{title}</h2>
      {subtitle && <p className="mx-auto max-w-2xl text-ink/60">{subtitle}</p>}
    </div>
  );
}
