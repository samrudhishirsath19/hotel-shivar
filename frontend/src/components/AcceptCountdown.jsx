import { useEffect, useState } from "react";

// Seconds until `until` (ISO time from the server). offsetMs = server time - this device's time.
export function useSecondsLeft(until, offsetMs = 0) {
  const calc = () => (until ? Math.max(0, Math.ceil((new Date(until).getTime() - (Date.now() + offsetMs)) / 1000)) : null);
  const [left, setLeft] = useState(calc);
  useEffect(() => {
    setLeft(calc());
    if (!until) return undefined;
    const t = setInterval(() => setLeft(calc()), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [until, offsetMs]);
  return left;
}

const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// "⏱ 1:43 left to accept" with a shrinking bar; turns red in the last 30 seconds.
// total = the full time to accept (seconds). onExpire runs once when it reaches 0.
export default function AcceptCountdown({ until, offsetMs = 0, total = 120, who = "", onExpire, compact = false }) {
  const left = useSecondsLeft(until, offsetMs);
  useEffect(() => {
    if (left === 0 && onExpire) onExpire();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left === 0]);
  if (left === null) return null;
  const urgent = left <= 30;
  if (left === 0) {
    return <p className="text-xs font-bold text-red-700 bg-red-50 rounded-lg px-3 py-2">⏱ Time to accept is over - the order is going back for reassignment</p>;
  }
  return (
    <div className={compact ? "" : "rounded-lg bg-white border px-3 py-2"} aria-live="polite">
      <p className={`text-xs font-bold ${urgent ? "text-red-700" : "text-gray-800"}`}>
        ⏱ {mmss(left)} left {who ? `for ${who} ` : ""}to accept
      </p>
      <div className="mt-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div className={`h-full ${urgent ? "bg-red-500" : "bg-green-500"} transition-all duration-1000`} style={{ width: `${Math.min(100, (left / total) * 100)}%` }} />
      </div>
    </div>
  );
}
