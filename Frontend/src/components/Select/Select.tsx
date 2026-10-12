import "./Select.scss";
import { useEffect, useState } from "react";

interface Option {
    value: string;
    label: string;
}

interface SelectProps {
    value?: string;
    label?: string;
    onChange?: (_value: string, _label: string) => void;
    selectedMonth?: number;
    selectedYear?: number;
    id?: string;
    placeholder?: string;
    name: string;
    options?: Option[];
}

const monthsList: Record<number, number> = {
    1: 31, // Январь
    2: 28, // Февраль
    3: 31, // Март
    4: 30, // Апрель
    5: 31, // Май
    6: 30, // Июнь
    7: 31, // Июль
    8: 31, // Август
    9: 30, // Сентябрь
    10: 31, // Октябрь
    11: 30, // Ноябрь
    12: 31, // Декабрь
};

function getDaysInMonth(month: number, year: number): number {
    if (!month) return 31;
    if (month === 2) {
        const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
        return isLeap ? 29 : 28;
    }
    return monthsList[month] ?? 31;
}

const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

export default function Select(props: SelectProps) {
    const [isOpen, setIsOpen] = useState(false);

    const { onChange } = props;

    useEffect(() => {
        document.addEventListener("click", handleClickOutside);
        return document.removeEventListener("click", handleClickOutside);
    }, []);

    const selectedLabel = props.label || "";

    const handleClickOutside = () => {
        setIsOpen(false);
    };

    const toggleDropDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    const selectOption = (value: string, label: string, e: any) => {
        e.stopPropagation();
        setIsOpen(false);
        onChange?.(value, label);

        if (props.onChange) {
            props.onChange(value, label);
        }
    };

    const getOption = () => {
        const { name, options } = props;

        if (options && options.length > 0) {
            return options;
        }

        if (name === "day") {
            const selectedMonth = props.selectedMonth ?? new Date().getMonth() + 1;
            const selectedYear = props.selectedYear || new Date().getFullYear();
            const dayInMonth = getDaysInMonth(selectedMonth, selectedYear);
            return Array.from({ length: dayInMonth }, (_, i) => ({
                value: String(i + 1),
                label: String(i + 1),
            }));
        }

        if (name === "month") {
            return monthNames.map((month, i) => ({
                value: String(i + 1),
                label: month,
            }));
        }

        if (name === "year") {
            const currentYear = new Date().getFullYear();
            return Array.from({ length: 100 }, (_, i) => ({
                value: String(currentYear - i),
                label: String(currentYear - i),
            }));
        }

        return [];
    };

    const options = getOption();

    return (
        <div className="select" id={props.id} data-name={props.name} onClick={toggleDropDown}>
            <div className="select__value">{selectedLabel || props.placeholder}</div>
            <div className={`select__toggle ${isOpen ? "open" : ""}`}>
                <img className="arrow-down" src="../../assets/svg/ArrowDown.svg" />
            </div>
            {isOpen && (
                <div className="select__dropdown shadow">
                    {options.map((option: any) => (
                        <div className="select__value" key={option.value} onClick={(e: any) => selectOption(option.value, option.label, e)}>
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
