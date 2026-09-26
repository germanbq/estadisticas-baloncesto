import { ReactNode } from "react";

type FilterButtonProps = {
    value: string;
    selected: string;
    setSelected: (value: string) => void;
    className: string;
    activeClassName: string;
    icon?: ReactNode;
}

export default function FilterButton({icon, value, selected, setSelected, className, activeClassName}: FilterButtonProps) {
    return (
        <button className={`${className} 
                                ${selected === value ? activeClassName : ""}`}
                                onClick={() => setSelected(value)}>
                                {icon} {value}
        </button>
    )
}