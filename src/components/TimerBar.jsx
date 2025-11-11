import { useEffect, useState } from "react";

export default function TimerBar({ seconds, onComplete }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) {
      onComplete?.();
      return;
    }
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(t);
          onComplete?.();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [remaining]);

  const pct = Math.max(0, ((seconds - remaining) / seconds) * 100);
  const minutes = Math.floor(remaining / 60);
  const secondsLeft = remaining % 60;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
        <div
          className="h-2 bg-brand-500 transition-all"
          style={{ width: `${pct}%` }}
        ></div>
      </div>
      <p className="text-sm text-slate-600">
        {minutes.toString().padStart(2, "0")}:
        {secondsLeft.toString().padStart(2, "0")}
      </p>
    </div>
  );
}
