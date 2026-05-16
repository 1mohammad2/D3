"use client";

import { useEffect, useState } from "react";

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getTimeLeft(target: string): TimeLeft {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function Box({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
        <span className="text-2xl sm:text-3xl font-black text-white tabular-nums">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-slate-500 text-xs uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

export function CountdownTimer({ targetDate }: { targetDate: string }) {
  // ✅ null on server → skeleton → no mismatch
  const [time, setTime] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setTime(getTimeLeft(targetDate));
    const id = setInterval(() => setTime(getTimeLeft(targetDate)), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  // Server and client BOTH render this initially → no mismatch
  if (time === null) {
    return (
      <div className="flex items-center justify-center gap-3">
        {["Days", "Hours", "Mins", "Secs"].map((label) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              <span className="text-2xl sm:text-3xl font-black text-slate-700">
                00
              </span>
            </div>
            <span className="text-slate-600 text-xs uppercase tracking-wider">
              {label}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <Box value={time.days} label="Days" />
      <span className="text-orange-500 text-xl font-black pb-6">:</span>
      <Box value={time.hours} label="Hours" />
      <span className="text-orange-500 text-xl font-black pb-6">:</span>
      <Box value={time.minutes} label="Mins" />
      <span className="text-orange-500 text-xl font-black pb-6">:</span>
      <Box value={time.seconds} label="Secs" />
    </div>
  );
}