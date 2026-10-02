import { ReactNode } from "react";

type FilterButtonProps = {
    value: string;
    selected: string;
    setSelected: (value: string) => void;
    className: string;
    activeClassName: string;
    selectedValue: string;
    icon?: ReactNode;
}

export default function FilterButton({icon, value, selected, setSelected, className, activeClassName, selectedValue}: FilterButtonProps) {
    return (
        <button className={`${className} 
                                ${selected === selectedValue ? activeClassName : ""}`}
                                onClick={() => setSelected(selectedValue)}>
                                {icon} {value}
        </button>
    )
}