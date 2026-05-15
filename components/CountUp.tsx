"use client";
import { useEffect, useState } from "react";
import { animate, useMotionValue, useTransform, motion } from "framer-motion";

export default function CountUp({ to, duration = 0.9 }: { to: number; duration?: number }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toString());
  const [, force] = useState(0);
  useEffect(() => {
    const controls = animate(mv, to, { duration, ease: [0.2, 0.8, 0.2, 1] });
    const unsub = rounded.on("change", () => force((n) => n + 1));
    return () => { controls.stop(); unsub(); };
  }, [to, duration, mv, rounded]);
  return <motion.span className="tabular-nums">{rounded.get()}</motion.span>;
}
