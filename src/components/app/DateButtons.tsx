"use client"

import { useEffect, useState } from "react";
import styles from "./DateButtons.module.css";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { GamesNum } from "@/src/backend/entities/gamesEntities";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type DateButtonProps = {
    date: Date;
    gamesNumber: number;
    day: Date;
    setDay: (date: Date) => void;
}

function DateButton({date, gamesNumber, day, setDay}: DateButtonProps) {
    const hoy = new Date();
    const esHoy = date.toDateString() === hoy.toDateString();
    const weekDay = date.toLocaleDateString("es-ES", { weekday: "short",});
    const month = date.toLocaleDateString("es-ES", { month: "short" });
    const monthDate = month.charAt(0).toUpperCase() + month.slice(1);
    return(
        <button className={`${styles.button} ${day.getDate() === date.getDate() && day.getMonth() === date.getMonth() && day.getFullYear() === date.getFullYear()     
                            ? styles.active : ""}`}
                onClick={() => setDay(date)}>
            <span>{esHoy ? "Hoy" : `${monthDate}, ${weekDay}`}</span>
            <span className={styles.date}>{date.getDate()}</span>
            <span>{gamesNumber} {gamesNumber === 1 ? "partido" : "partidos"}</span>        
        </button>
    )
}

export default function DateButtons({date, setDate, getDateString}: 
                            {date: Date, setDate: (date: Date) => void, getDateString: (date: Date) => string }) {

    function addDays(date: string, amount: number): Date {
        const result = new Date(`${date}T00:00:00`);
        result.setDate(result.getDate() + amount);
        return result;
    }

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [numberGames, setNumberGames] = useState<GamesNum[]>([]);
    const [referenceDate, setReferenceDate] = useState<string>(searchParams.get("reference") ?? getDateString(new Date()))
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if(searchParams.get("reference") === referenceDate) return;

        const params = new URLSearchParams(searchParams.toString());
        params.set("reference", referenceDate);
        router.replace(`${pathname}?${params.toString()}`)
    }, [referenceDate, router, pathname, searchParams]) 

    useEffect(() => {
        const controller = new AbortController();

        async function loadNumberGames() {
            try{
                setLoading(true);
                const response = await fetch(`/api/partidos/numero?date=${referenceDate}`, 
                { signal: controller.signal })
                const result = await response.json();

                if(!response.ok) {
                    throw new Error(result.error ??`Error ${response.status}`);
                } 

                setNumberGames(result.data);
            } catch (error) {
                if (controller.signal.aborted) return;
                console.error(error);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }

        void loadNumberGames();
        return () => controller.abort();
    }, [referenceDate])

    return (
        <section className={styles.buttonsContainer}>
                {!loading ?  <ChevronLeft className={styles.chevron} onClick={() => { const auxDate = addDays(referenceDate, -5); setReferenceDate(getDateString(auxDate)); setDate(auxDate)}}/> : ""}
                {numberGames.map((number, index) => 
                    <DateButton key={index} date={new Date(`${number.date}T00:00:00`)} gamesNumber={number.gamesNumber} day={date} setDay={setDate}/>
                )}
                {!loading ?  <ChevronRight className={styles.chevron} onClick={() => { const auxDate = addDays(referenceDate, 5); setReferenceDate(getDateString(auxDate)); setDate(auxDate)}}/> : ""}
        </section>
    )
}