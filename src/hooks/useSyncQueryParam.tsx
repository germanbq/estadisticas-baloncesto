"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useSyncQueryParams(values: Record<string, string>) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const queryKey = new URLSearchParams(values).toString();

    useEffect(() => {
      const params = new URLSearchParams(searchParams.toString());

      new URLSearchParams(queryKey).forEach((value, name) => {
        params.set(name, value);
      });
      const nextQuery = params.toString();

      if (nextQuery === searchParams.toString()) return;

      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    }, [queryKey, pathname, router, searchParams]);
}