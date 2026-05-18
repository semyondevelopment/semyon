"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw } from "lucide-react";

export default function SwRegister() {
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    let mounted = true;

    navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" })
      .then((reg) => {
        // Periodically check for updates while the app is open.
        const tick = () => reg.update().catch(() => {});
        tick();
        const id = setInterval(tick, 60_000); // every minute
        return () => clearInterval(id);
      })
      .catch(() => {});

    // Listen for new SW activation -> prompt to reload.
    function onMessage(ev: MessageEvent) {
      if (!mounted) return;
      if (ev.data?.type === "sw-updated") setUpdateReady(true);
    }
    navigator.serviceWorker.addEventListener("message", onMessage);

    // Also reload when controller changes (new SW takes over).
    let firstControllerChange = true;
    function onControllerChange() {
      if (firstControllerChange) { firstControllerChange = false; return; }
      // Auto-reload if user hasn't dismissed.
      if (mounted) setUpdateReady(true);
    }
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      mounted = false;
      navigator.serviceWorker.removeEventListener("message", onMessage);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  function reload() {
    setUpdateReady(false);
    window.location.reload();
  }

  return (
    <AnimatePresence>
      {updateReady && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          onClick={reload}
          className="fixed bottom-24 left-1/2 z-[55] -translate-x-1/2 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-bg/95 px-4 py-2 text-sm font-medium shadow-2xl backdrop-blur transition hover:bg-bg active:scale-95 md:bottom-6"
        >
          <Sparkles size={14} className="text-accent" />
          <span>New version</span>
          <RefreshCw size={12} className="text-sub" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
