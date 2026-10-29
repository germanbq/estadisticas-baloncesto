"use client"

import { useEffect, useState } from "react";

export function useFetch<T>(url: string | null) {
    const [data, setData] = useState<T | null>(null)
    const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
    const [hasError, setHasError] = useState(false);
    const loading = url !== null && loadedUrl !== url;
            
    useEffect(() => {
        if (url === null) return;

        const controller = new AbortController();
                    
        async function loadData(requestUrl: string) {
            setLoadedUrl(null);
            setHasError(false);

            try {
                const response = await fetch(requestUrl,
                    { signal: controller.signal });
                const result = await response.json();
                            
                if(!response.ok) {
                    throw new Error(result.error ??`Error ${response.status}`);
                }
            
                if (!controller.signal.aborted) {
                    setData(result.data);
                }
            }
            catch(error) {
                if (controller.signal.aborted) return;
                setData(null);
                setHasError(true);
                console.error(error);
            } finally {
                if (!controller.signal.aborted) setLoadedUrl(requestUrl);
            }
        }
            
        void loadData(url);
        return () => controller.abort();
    }, [url]);

    return {data, setData, loading, hasError};
}
