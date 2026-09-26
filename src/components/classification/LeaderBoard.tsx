"use client"

import styles from "./LeaderBoard.module.css";
import FilterButton from "../FilterButton";
import { useState } from "react";
import Image from "next/image";
import { Sunrise, Sunset } from "lucide-react";

type StandingLabelProps = {
    text: string;
    className: string;
}

function StandingLabel({text, className}: StandingLabelProps) {
    return (
        <div className={`${styles.label} ${styles[className]}`}>
            <span className={styles.dot}></span>
            {text}
        </div>
    )
}
export default function LeaderBoard() {
    const [conf, setConf] = useState("CONFERENCIA ESTE");
    return (
        <section className={styles.section}>
            <span className={styles.seasonSpan}>Temporada regular 2025-2026</span>
            <div className={styles.buttonsContainer}>
                <FilterButton icon={<Sunrise />} value="CONFERENCIA ESTE" selected={conf} setSelected={setConf} className={styles.button} activeClassName={styles.active} />
                <FilterButton icon={<Sunset />} value="CONFERENCIA OESTE" selected={conf} setSelected={setConf} className={styles.button} activeClassName={styles.active} />
            </div>
            <div className={styles.table}>
                <div className={styles.labelsContainer}>
                    <StandingLabel text="Playoffs directos (1-6)" className="playoffs" />
                    <StandingLabel text="Play-in (7-10)" className="playin" />
                    <StandingLabel text="Eliminación directa (11-15)" className="eliminated" />
                </div>

                <table className={styles.table} > 
                    <thead>
                        <tr>
                            <th>Pos</th>
                            <th>Equipo</th>
                            <th>División</th>
                            <th>V</th>
                            <th>D</th>
                            <th>%V</th>
                            <th>Dif</th>
                            <th>Última racha</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><span className={styles.positionBadge}>1</span></td>
                            <td>
                                <div className={styles.logoAndName}>
                                    <Image src="/boston-celtics.webp"  className={styles.teamLogo} alt="Logo Boston Celtics" width={0} height={0}/>
                                    <span>Boston Celtics</span>
                                </div>
                            </td>
                            <td>Atlántico</td>
                            <td>48</td>
                            <td>12</td>
                            <td className={styles.percentage}>.800</td>
                            <td className={true ? styles.positive : styles.negative}>+10.4</td>
                            <td className={true ? styles.positive : styles.negative}>W10</td>
                        </tr>
                        <tr>
                            <td><span className={styles.positionBadge}>2</span></td>
                            <td>
                                <div className={styles.logoAndName}>
                                    <Image src="/cleveland-cavaliers.webp" className={styles.teamLogo} alt="Logo Cleveland Cavaliers" width={0} height={0}/>
                                    <span>Cleveland Cavaliers</span>
                                </div>
                            </td>
                            <td>Central</td>
                            <td>45</td>
                            <td>15</td>
                            <td className={styles.percentage}>.750</td>
                            <td className={true ? styles.positive : styles.negative}>+7.4</td>
                            <td className={true ? styles.positive : styles.negative}>W4</td>
                        </tr>
                        <tr>
                            <td><span className={styles.positionBadge}>3</span></td>
                            <td>
                                <div className={styles.logoAndName}>
                                    <Image src="/new-york-knicks.webp" className={styles.teamLogo} alt="Logo New York Knicks" width={0} height={0}/>
                                    <span>New York Knicks</span>
                                </div>
                            </td>
                            <td>Atlántico</td>
                            <td>40</td>
                            <td>22</td>
                            <td className={styles.percentage}>.645</td>
                            <td className={true ? styles.positive : styles.negative}>+5.1</td>
                            <td className={true ? styles.positive : styles.negative}>W2</td>
                        </tr>
                        <tr>
                            <td><span className={styles.positionBadge}>4</span></td>
                            <td>
                                <div className={styles.logoAndName}>
                                    <Image src="/milwaukee-bucks.webp" className={styles.teamLogo} alt="Logo Milwaukee Bucks" width={0} height={0}/>
                                    <span>Milwaukee Bucks</span>
                                </div>
                            </td>
                            <td>Central</td>
                            <td>38</td>
                            <td>23</td>
                            <td className={styles.percentage}>.623</td>
                            <td className={true ? styles.positive : styles.negative}>+4.2</td>
                            <td className={true ? styles.negative : styles.positive}>L1</td>
                        </tr>

                        <tr>
                            <td><span className={styles.positionBadge}>5</span></td>
                            <td>
                                <div className={styles.logoAndName}>
                                    <Image src="/indiana-pacers.webp" className={styles.teamLogo} alt="Logo Indiana Pacers" width={0} height={0}/>
                                    <span>Indiana Pacers</span>
                                </div>
                            </td>
                            <td>Central</td>
                            <td>35</td>
                            <td>26</td>
                            <td className={styles.percentage}>.574</td>
                            <td className={true ? styles.positive : styles.negative}>+2.8</td>
                            <td className={true ? styles.positive : styles.negative}>W3</td>
                        </tr>

                        <tr>
                            <td><span className={styles.positionBadge}>6</span></td>
                            <td>
                                <div className={styles.logoAndName}>
                                    <Image src="/philadelphia-76ers.webp" className={styles.teamLogo} alt="Logo Philadelphia 76ers" width={0} height={0}/>
                                    <span>Philadelphia 76ers</span>
                                </div>
                            </td>
                            <td>Atlántico</td>
                            <td>34</td>
                            <td>27</td>
                            <td className={styles.percentage}>.557</td>
                            <td className={true ? styles.positive : styles.negative}>+1.9</td>
                            <td className={true ? styles.negative : styles.positive}>L2</td>
                        </tr>

                        <tr>
                            <td><span className={styles.positionBadge}>7</span></td>
                            <td>
                                <div className={styles.logoAndName}>
                                    <Image src="/miami-heat.webp" className={styles.teamLogo} alt="Logo Miami Heat" width={0} height={0}/>
                                    <span>Miami Heat</span>
                                </div>
                            </td>
                            <td>Sureste</td>
                            <td>33</td>
                            <td>28</td>
                            <td className={styles.percentage}>.541</td>
                            <td className={true ? styles.positive : styles.negative}>+0.9</td>
                            <td className={true ? styles.positive : styles.negative}>W1</td>
                        </tr>

                        <tr>
                            <td><span className={styles.positionBadge}>8</span></td>
                            <td>
                                <div className={styles.logoAndName}>
                                    <Image src="/orlando-magic.webp" className={styles.teamLogo} alt="Logo Orlando Magic" width={0} height={0}/>
                                    <span>Orlando Magic</span>
                                </div>
                            </td>
                            <td>Sureste</td>
                            <td>32</td>
                            <td>30</td>
                            <td className={styles.percentage}>.516</td>
                            <td className={true ? styles.positive : styles.negative}>+1.3</td>
                            <td className={true ? styles.negative : styles.positive}>L1</td>
                        </tr>

                        <tr>
                            <td><span className={styles.positionBadge}>9</span></td>
                            <td>
                                <div className={styles.logoAndName}>
                                    <Image src="/chicago-bulls.webp" className={styles.teamLogo} alt="Logo Chicago Bulls" width={0} height={0}/>
                                    <span>Chicago Bulls</span>
                                </div>
                            </td>
                            <td>Central</td>
                            <td>28</td>
                            <td>34</td>
                            <td className={styles.percentage}>.452</td>
                            <td className={true ? styles.negative : styles.positive}>-1.4</td>
                            <td className={true ? styles.positive : styles.negative}>W2</td>
                        </tr>

                        <tr>
                            <td><span className={styles.positionBadge}>10</span></td>
                            <td>
                                <div className={styles.logoAndName}>
                                    <Image src="/atlanta-hawks.webp" className={styles.teamLogo} alt="Logo Atlanta Hawks" width={0} height={0}/>
                                    <span>Atlanta Hawks</span>
                                </div>
                            </td>
                            <td>Sureste</td>
                            <td>27</td>
                            <td>34</td>
                            <td className={styles.percentage}>.443</td>
                            <td className={true ? styles.negative : styles.positive}>-2.1</td>
                            <td className={true ? styles.negative : styles.positive}>L3</td>
                        </tr>

                        <tr>
                            <td><span className={styles.positionBadge}>11</span></td>
                            <td>
                                <div className={styles.logoAndName}>
                                    <Image src="/brooklyn-nets.webp" className={styles.teamLogo} alt="Logo Brooklyn Nets" width={0} height={0}/>
                                    <span>Brooklyn Nets</span>
                                </div>
                            </td>
                            <td>Atlántico</td>
                            <td>25</td>
                            <td>37</td>
                            <td className={styles.percentage}>.403</td>
                            <td className={true ? styles.negative : styles.positive}>-3.8</td>
                            <td className={true ? styles.positive : styles.negative}>W1</td>
                        </tr>

                        <tr>
                            <td><span className={styles.positionBadge}>12</span></td>
                            <td>
                                <div className={styles.logoAndName}>
                                    <Image src="/toronto-raptors.webp" className={styles.teamLogo} alt="Logo Toronto Raptors" width={0} height={0}/>
                                    <span>Toronto Raptors</span>
                                </div>
                            </td>
                            <td>Atlántico</td>
                            <td>23</td>
                            <td>39</td>
                            <td className={styles.percentage}>.371</td>
                            <td className={true ? styles.negative : styles.positive}>-5.6</td>
                            <td className={true ? styles.negative : styles.positive}>L4</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    )
}