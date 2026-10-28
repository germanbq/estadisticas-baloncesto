"use client"

import { useEffect, useState } from "react";
import styles from "./DateButtons.module.css";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { GamesNum } from "@/src/backend/entities/gamesEntities";
import { useSearchParams } from "next/navigation";
import DateButtonsSkeleton from '../skeletons/DateButtonsSkeleton';
import { useSyncQueryParams } from "@/src/hooks/useSyncQueryParam";

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
    const isActive = day.getDate() === date.getDate() && day.getMonth() === date.getMonth() && day.getFullYear() === date.getFullYear();     
    return(
        <button className={`${styles.button} ${ isActive ? styles.active : ""}`} onClick={() => setDay(date)} aria-label={`Cambiar a fecha ${monthDate}, ${date.getDate()} `} aria-pressed={isActive}>
            <span>{esHoy ? "Hoy" : `${monthDate}, ${weekDay}`}</span>
            <span className={styles.date}>{date.getDate()}</span>
            <span>{gamesNumber} {gamesNumber === 1 ? "partido" : "partidos"}</span>        
        </button>
    )
}

export function addDays(date: string, amount: number): Date {
    const result = new Date(`${date}T00:00:00`);
    result.setDate(result.getDate() + amount);
    return result;
}

export default function DateButtons({date, setDate, getDateString}: 
                            {date: Date, setDate: (date: Date) => void, getDateString: (date: Date) => string }) {

    const searchParams = useSearchParams();

    const [numberGames, setNumberGames] = useState<GamesNum[]>([]);
    const [referenceDate, setReferenceDate] = useState<string>(searchParams.get("reference") ?? getDateString(new Date()))
    const [loading, setLoading] = useState(true);

    useSyncQueryParams({reference: referenceDate})

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

    if (loading) return <DateButtonsSkeleton />;

    return (
        <section className={styles.buttonsContainer} aria-label="Seleccionar fecha de los partidos" >
            <button className={styles.chevronButton} type="button"  onClick={() => { const auxDate = addDays(referenceDate, -5); setReferenceDate(getDateString(auxDate)); setDate(auxDate)}} aria-label="Cambiar a fechas anteriores">
                {!loading ?  <ChevronLeft className={styles.chevron}/> : ""}
            </button>
                {numberGames.map((number, index) => 
                    <DateButton key={index} date={new Date(`${number.date}T00:00:00`)} gamesNumber={number.gamesNumber} day={date} setDay={setDate}/>
                )}
            <button className={styles.chevronButton} type="button" onClick={() => { const auxDate = addDays(referenceDate, 5); setReferenceDate(getDateString(auxDate)); setDate(auxDate)}} aria-label="Cambiar a fechas posteriores">
                {!loading ? <ChevronRight className={styles.chevron}/> : ""}
            </button>
        </section>
    )
}
