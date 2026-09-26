type FilterButtonProps = {
    value: string;
    selected: string;
    setSelected: (value: string) => void;
    className: string;
    activeClassName: string;
}

export default function FilterButton({value, selected, setSelected, className, activeClassName}: FilterButtonProps) {
    return (
        <button className={`${className} 
                                ${selected === value ? activeClassName : ""}`}
                                onClick={() => setSelected(value)}>
                                {value}
        </button>
    )
}