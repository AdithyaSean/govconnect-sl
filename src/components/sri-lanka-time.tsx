
"use client";

import { useState, useEffect } from 'react';

export function SriLankaTime() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const timerId = setInterval(() => {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Colombo',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      const slTime = new Date().toLocaleTimeString('en-US', options);
      setTime(`${slTime} (SLST)`);
    }, 1000);

    // Cleanup the interval on component unmount
    return () => clearInterval(timerId);
  }, []);

  return (
    <div className="hidden sm:flex items-center text-sm font-medium text-muted-foreground mr-4">
      {time}
    </div>
  );
}
