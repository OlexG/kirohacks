"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

type LiveDataRefreshProps = {
  intervalMs?: number;
};

export function LiveDataRefresh({ intervalMs = 5000 }: Readonly<LiveDataRefreshProps>) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      startTransition(() => {
        router.refresh();
      });
    };

    intervalRef.current = window.setInterval(refresh, intervalMs);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [intervalMs, router]);

  return null;
}
