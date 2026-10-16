import layoutStyles from "../classification/LeaderBoard.module.css";
import styles from "./LeaderBoardSkeleton.module.css";

export default function LeaderBoardSkeleton() {
    return (
        <tbody aria-hidden="true">
            {Array.from({length: 15}, (_, index) => (
                <tr key={index}>
                    <td><div className={`${styles.skeleton} ${styles.position}`} /></td>
                    <td>
                        <div className={layoutStyles.logoAndName}>
                            <div className={layoutStyles.teamLink}>
                                <div className={`${styles.skeleton} ${styles.logo}`} />
                                <div className={`${styles.skeleton} ${styles.name}`} />
                            </div>
                            <div className={`${styles.skeleton} ${styles.favorite}`} />
                        </div>
                    </td>
                    <td><div className={`${styles.skeleton} ${styles.division}`} /></td>
                    {[0, 1, 2, 3, 4].map((column) => (
                        <td key={column}><div className={`${styles.skeleton} ${styles.value}`} /></td>
                    ))}
                </tr>
            ))}
        </tbody>
    );
}
