import { Database, type LucideIcon } from "lucide-react";
import styles from "./NoDataCard.module.css";

export default function NoDataCard({ name, icon: Icon, text }: { name?: string; icon?: LucideIcon; text: string }) {
    return (
        <section className={styles.section}>
            {(name || Icon) && (
                <h2 className={styles.title}>
                    {Icon && <Icon size={25} strokeWidth={2} aria-hidden="true" />}
                    {name}
                </h2>
            )}
            <div className={styles.emptyState} role="status">
                <Database size={40} aria-hidden="true" />
                <span className={styles.emptyTitle}>{text}</span>
            </div>
        </section>
    );
}
