"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";

type LiveDataRefreshProps = {
  intervalMs?: number;
  statusText?: string;
  updatedAt?: string | null;
  variant?: "silent" | "profile";
  watchedKey?: string | null;
};

function formatWebhookTime(updatedAt: string | null | undefined) {
  if (!updatedAt) {
    return "Waiting for the latest watch check-in";
  }

  const parsed = new Date(updatedAt);
  if (Number.isNaN(parsed.getTime())) {
    return "Latest watch check-in received";
  }

  const time = parsed.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return `Updated ${time}`;
}

export function LiveDataRefresh({
  intervalMs = 5000,
  statusText = "Live webhook",
  updatedAt = null,
  variant = "silent",
  watchedKey = null,
}: Readonly<LiveDataRefreshProps>) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const progressRef = useRef<number | null>(null);
  const refreshStartedAtRef = useRef<number>(0);
  const previousWatchedKeyRef = useRef<string | null | undefined>(watchedKey);

  useEffect(() => {
    refreshStartedAtRef.current = Date.now();

    const refresh = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      refreshStartedAtRef.current = Date.now();
      setProgress(0);
      startTransition(() => {
        router.refresh();
      });
    };

    intervalRef.current = window.setInterval(refresh, intervalMs);
    progressRef.current = window.setInterval(() => {
      const elapsed = Date.now() - refreshStartedAtRef.current;
      setProgress(Math.min(100, Math.round((elapsed / intervalMs) * 100)));
    }, 250);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
      if (progressRef.current !== null) {
        window.clearInterval(progressRef.current);
      }
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [intervalMs, router]);

  useEffect(() => {
    if (variant !== "profile") {
      return;
    }

    if (isPending) {
      document.body.dataset.profileRefreshState = "refreshing";
      return () => {
        delete document.body.dataset.profileRefreshState;
      };
    }

    delete document.body.dataset.profileRefreshState;
  }, [isPending, variant]);

  useEffect(() => {
    if (variant !== "profile") {
      return;
    }

    if (!watchedKey || previousWatchedKeyRef.current === watchedKey) {
      previousWatchedKeyRef.current = watchedKey;
      return;
    }

    previousWatchedKeyRef.current = watchedKey;
    document.body.dataset.profileChartState = "updated";

    const timeout = window.setTimeout(() => {
      delete document.body.dataset.profileChartState;
    }, 1200);

    return () => {
      window.clearTimeout(timeout);
      delete document.body.dataset.profileChartState;
    };
  }, [variant, watchedKey]);

  if (variant === "silent") {
    return null;
  }

  return (
    <div
      className={`profile-live-console${isPending ? " refreshing" : ""}`}
      aria-live="polite"
    >
      <div className="profile-live-console-top">
        <span className="profile-live-orb" aria-hidden="true" />
        <div>
          <strong>{statusText}</strong>
          <small>Live watch data is on</small>
        </div>
      </div>
      <div className="profile-live-console-meter" aria-hidden="true">
        <span style={{ inlineSize: `${progress}%` }} />
      </div>
      <div className="profile-live-console-bottom">
        <span>{formatWebhookTime(updatedAt)}</span>
      </div>
    </div>
  );
}

type LiveMetricValueProps = {
  children: ReactNode;
  className?: string;
  compareKey: string | number | null | undefined;
};

export function LiveMetricValue({ children, className }: Readonly<LiveMetricValueProps>) {
  const displayClassName = ["live-metric-value", className].filter(Boolean).join(" ");

  return <strong className={displayClassName}>{children}</strong>;
}
