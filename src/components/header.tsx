"use client"

import Link from "next/link";
import Image from "next/image";
import { CalendarDays, ListOrdered, Users, CircleUserRound, Star } from "lucide-react";
import styles from "./header.module.css";
import { usePathname } from "next/navigation";

export default function Header() {
    const pathname = usePathname();

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
                <Link href="/" aria-label="Favoritos">
                    <Star className={`${styles.icon} ${pathname === "/favoritos" ? styles.active : ""}`}/>
                </Link>
            </div>
            <Link href="/" className={styles.profile} aria-label="Perfil">
                <CircleUserRound className={`${styles.icon} ${pathname === "/perfil" ? styles.active : ""}`}/>
            </Link>
        </header>
    )
}