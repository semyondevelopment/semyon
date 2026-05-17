"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const WORDS = ["nothing", "changes", "if", "nothing", "changes"];
const HOLD_MS = 1700;

export default function Preloader() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShow(false), HOLD_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03, filter: "blur(8px)" }}
          transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          style={{
            background:
              "radial-gradient(900px 600px at 50% 45%, rgba(209,250,110,0.08), transparent 60%), radial-gradient(700px 500px at 50% 90%, rgba(120,170,255,0.05), transparent 60%), #0b0b0c",
          }}
        >
          {/* subtle ambient orb */}
          <motion.div
            aria-hidden
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
            className="absolute h-72 w-72 rounded-full bg-accent/10 blur-3xl"
          />

          <div className="relative flex max-w-[90vw] flex-wrap items-baseline justify-center gap-x-2 gap-y-1 px-6 text-center sm:gap-x-3">
            {WORDS.map((word, i) => {
              const accent = word === "changes";
              return (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{
                    delay: 0.08 + i * 0.09,
                    duration: 0.55,
                    ease: [0.2, 0.8, 0.2, 1],
                  }}
                  className={`text-3xl font-semibold tracking-tight sm:text-4xl ${
                    accent ? "italic text-accent" : "text-ink"
                  }`}
                  style={
                    accent
                      ? { textShadow: "0 0 30px rgba(209,250,110,0.35)" }
                      : undefined
                  }
                >
                  {word}
                </motion.span>
              );
            })}
          </div>

          {/* drawing line underneath */}
          <motion.div
            aria-hidden
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 56, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative mt-6 h-[2px] rounded-full bg-accent"
            style={{ boxShadow: "0 0 18px rgba(209,250,110,0.7)" }}
          />

          {/* author whisper */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
            className="mt-6 text-[10px] uppercase tracking-[0.32em] text-sub"
          >
            Life OS
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
