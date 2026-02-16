"use client";

import { useState, useEffect } from "react";

export function CountdownTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    function update() {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) { setExpired(true); return; }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  if (expired) return <span className="text-red-600 font-medium text-sm">Sale ended</span>;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex gap-1 items-center">
      {timeLeft.days > 0 && (
        <div className="bg-red-600 text-white rounded px-1.5 py-0.5 text-xs font-bold">{timeLeft.days}d</div>
      )}
      <div className="bg-red-600 text-white rounded px-1.5 py-0.5 text-xs font-mono font-bold">
        {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
      </div>
    </div>
  );
}
