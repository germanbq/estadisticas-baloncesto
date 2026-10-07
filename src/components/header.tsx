"use client"

import Link from "next/link";
import Image from "next/image";
import { CalendarDays, ListOrdered, Users, Star } from "lucide-react";
import styles from "./Header.module.css";
import { usePathname } from "next/navigation";
import AccountButton from "./profile/AccountButton";
import { useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const {isLoaded, isSignedIn} = useUser();
    const { openSignIn } = useClerk();

    function handleClick() {
        if(!isLoaded) return;
        if(!isSignedIn) {
            openSignIn();
            router.push(`${pathname}`);
            return;
        }

        router.push("/favoritos");
        return;
    }
    return (
        <header className={styles.header}>
            <Link href="/" className={styles.logo}>
                <Image src="/logo.webp" alt="Logo de la aplicación" width={40} height={40}/>
            </Link>
            <div className={styles.icons}>
                <Link href="/" aria-label="Partidos">
                    <CalendarDays className={`${styles.icon} ${pathname === "/" ? styles.active : ""}`}/>
                </Link>
                <Link href="/clasificacion" aria-label="Clasificación">
                    <ListOrdered className={`${styles.icon} ${pathname === "/clasificacion" ? styles.active : ""}`}/>
                </Link>
                <Link href="/jugadores" aria-label="Jugadores">
                    <Users className={`${styles.icon} ${pathname === "/jugadores" ? styles.active : ""}`}/>
                </Link>
                <button aria-label="Favoritos" onClick={handleClick}>
                    <Star className={`${styles.icon} ${pathname === "/favoritos" ? styles.active : ""}`}/>
                </button>
            </div>
            <AccountButton />
        </header>
    )
}