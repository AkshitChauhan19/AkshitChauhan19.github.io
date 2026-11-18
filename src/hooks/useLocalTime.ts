import { useEffect, useState } from 'react';

function formatISTTime(): string {
  try {
    const now = new Date();
    const formatted = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(now);
    return `${formatted} UTC+5:30`;
  } catch {
    return 'IST UTC+5:30';
  }
}

export function useLocalTime(): string {
  const [time, setTime] = useState<string>(() => formatISTTime());

  useEffect(() => {
    const id = window.setInterval(() => {
      setTime(formatISTTime());
    }, 15000);
    return () => window.clearInterval(id);
  }, []);

  return time;
}
