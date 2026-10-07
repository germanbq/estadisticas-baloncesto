import { useClerk, useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";

export default function FavoriteButton({type, itemId, isFavorite, onFavoriteChange, disabled}: 
                    {type: string, itemId: number, isFavorite: boolean, 
                        onFavoriteChange?: (fav: boolean) => void, disabled: boolean}) {
    const {isLoaded, isSignedIn} = useUser();
    const { openSignIn } = useClerk();
    const [favorite, setFavorite] = useState(isFavorite);
    const [loading, setLoading] = useState(false);
    const controllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        return () => controllerRef.current?.abort();
    }, []);

    async function handleClick() {
        if(!isLoaded) return;
        if(!isSignedIn) {
            openSignIn();
            return;
        }

       if (controllerRef.current) return;

        const controller = new AbortController();
        controllerRef.current = controller;
        setLoading(true);

        try {
            const response = await fetch(`/api/favoritos/${type}?itemId=${itemId}`, {
                method: favorite ? "DELETE" : "POST",
                signal: controller.signal,
            });

            if (!response.ok) throw new Error("Error al guardar favorito");

            if (!controller.signal.aborted) {
                const nextFavorite = !favorite;
                setFavorite(nextFavorite);
                onFavoriteChange?.(nextFavorite);
            }
        } catch (error) {
            if (!controller.signal.aborted) console.error(error);
        } finally {
            controllerRef.current = null;

            if (!controller.signal.aborted) {
                setLoading(false);
            }
        }
    }

    return (
        <button type="button" onClick={handleClick} disabled={!isLoaded || loading || disabled}>
            <Star />
        </button>
    )
}