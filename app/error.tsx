"use client";
import { useEffect } from "react";
import SetupNeeded from "@/components/SetupNeeded";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isDbIssue = /TURSO|database|libsql|fetch|UNAUTH/i.test(error.message || "");
  if (isDbIssue || error.digest) {
    return (
      <div className="space-y-4">
        <SetupNeeded error={error.message || `Digest: ${error.digest ?? "unknown"}`} />
        <button onClick={reset} className="btn">Try again</button>
      </div>
    );
  }

  return (
    <div className="card p-6 space-y-3">
      <div className="text-lg font-medium">Something broke.</div>
      <pre className="overflow-x-auto text-xs text-sub">{error.message}{error.digest ? `\nDigest: ${error.digest}` : ""}</pre>
      <button onClick={reset} className="btn btn-accent">Try again</button>
    </div>
  );
}
