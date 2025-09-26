"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";

export default function PostHogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (token && token !== "dummy_posthog_key") {
      posthog.init(token, {
        api_host:
          process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
      });
    }
  }, []);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (pathname && token && token !== "dummy_posthog_key") {
      posthog.capture("$pageview", {
        $current_url: window.location.href,
      });
    }
  }, [pathname, searchParams]);

  return <>{children}</>;
}
