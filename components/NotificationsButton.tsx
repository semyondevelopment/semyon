"use client";
import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";

type Perm = "default" | "granted" | "denied" | "unsupported";

export default function NotificationsButton() {
  const [perm, setPerm] = useState<Perm>("default");
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPerm("unsupported"); return;
    }
    setPerm(Notification.permission as Perm);
    navigator.serviceWorker.getRegistration("/sw.js").then((r) => setRegistered(!!r));
  }, []);

  async function enable() {
    if (!("serviceWorker" in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      setRegistered(true);
      const p = await Notification.requestPermission();
      setPerm(p as Perm);
      if (p === "granted" && reg.active) {
        reg.active.postMessage({
          type: "notify",
          title: "Notifications on",
          body: "Life OS will remind you about training & reviews.",
          tag: "welcome",
          url: "/",
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function test() {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    reg?.active?.postMessage({
      type: "notify",
      title: "Test reminder",
      body: "It works. See you at the gym.",
      tag: "test",
      url: "/training",
    });
  }

  if (perm === "unsupported") {
    return (
      <button disabled className="btn w-full justify-between text-sub" aria-disabled>
        <span className="inline-flex items-center gap-2"><BellOff size={14} />Notifications not supported</span>
        <span className="text-[11px]">install as PWA</span>
      </button>
    );
  }

  if (perm === "granted") {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm">
        <span className="inline-flex items-center gap-2 text-emerald-400">
          <BellRing size={16} />Notifications on
        </span>
        <button onClick={test} className="text-[11px] text-sub transition hover:text-ink">send test</button>
      </div>
    );
  }

  if (perm === "denied") {
    return (
      <div className="rounded-2xl border border-line bg-panel/60 p-3 text-sm text-sub">
        Notifications were blocked. Enable them in your browser/iOS settings, then reload.
      </div>
    );
  }

  return (
    <button
      onClick={enable}
      className="flex w-full items-center justify-between rounded-2xl border border-accent/30 bg-accent/5 p-3 text-sm transition hover:bg-accent/10 active:scale-[0.99]"
    >
      <span className="inline-flex items-center gap-2 text-accent">
        <Bell size={16} />Enable reminders
      </span>
      <span className="text-[11px] text-sub">training · weekly review</span>
    </button>
  );
}
