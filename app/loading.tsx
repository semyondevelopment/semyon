export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-3 w-24 rounded-full bg-line/70" />
        <div className="h-10 w-40 rounded-lg bg-line/70" />
        <div className="h-3 w-56 rounded-full bg-line/40" />
      </div>
      <div className="h-12 rounded-2xl bg-line/40" />
      <div className="space-y-2">
        <div className="h-20 rounded-2xl bg-line/40" />
        <div className="h-20 rounded-2xl bg-line/40" />
        <div className="h-20 rounded-2xl bg-line/40" />
      </div>
    </div>
  );
}
