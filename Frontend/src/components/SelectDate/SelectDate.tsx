import "./SelectDate.scss";
import Select from "../Select/Select";
import { AppStorage } from "../../App";
import { useState } from "react";

interface SelectDateProps {
    onChange?: (_date: { day: string; month: string; year: string }) => void;
    birthDay?: string;
    birthMonth?: string;
    birthYear?: string;
}

function daysInMonth(month: number, year: number): number {
    return new Date(year, month, 0).getDate();
}

function isValidDay(day: number, month: number, year: number): boolean {
    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
    const max = daysInMonth(month, year);
    return day >= 1 && day <= max;
}

export default function SelectDate(props: SelectDateProps) {
    const { birthDay, birthMonth, birthYear } = props;

    const [day, setDay] = useState<string>("");
    const [month, setMonth] = useState<string>("");
    const [year, setYear] = useState<string>("");

    const getDay = () => day || birthDay || "";
    const getMonth = () => month || birthMonth || "";
    const getYear = () => year || birthYear || "";

    const handleDayChange = (value: string) => {
        setDay(value);
        if (props.onChange) {
            props.onChange({
                day: value,
                month: getMonth(),
                year: getYear(),
            });
        }
    };

    const handleMonthChange = (value: string) => {
        const newMonth = value;
        const currentYear = getYear();
        const currentDay = getDay();

        let newDay = currentDay;
        if (currentDay && newMonth && currentYear) {
            const dayNum = parseInt(currentDay, 10);
            const monthNum = parseInt(newMonth, 10);
            const yearNum = parseInt(currentYear, 10);
            if (!isValidDay(dayNum, monthNum, yearNum)) {
                newDay = "";
            }
        }
        setMonth(newMonth);
        setDay(newDay);
        if (props.onChange) {
            props.onChange({
                day: newDay,
                month: newMonth,
                year: currentYear,
            });
        }
    };

    const handleYearChange = (value: string) => {
        const newYear = value;
        const currentMonth = getMonth();
        const currentDay = getDay();

        let newDay = currentDay;
        if (currentDay && currentMonth && newYear) {
            const dayNum = parseInt(currentDay, 10);
            const monthNum = parseInt(currentMonth, 10);
            const yearNum = parseInt(newYear, 10);
            if (!isValidDay(dayNum, monthNum, yearNum)) {
                newDay = "";
            }
        }

        setYear(newYear);
        setDay(newDay);
        if (props.onChange) {
            props.onChange({
                day: newDay,
                month: currentMonth,
                year: newYear,
            });
        }
    };

    const t = (key: string) => AppStorage.t(key);

    const displayMonth = getMonth();
    const displayYear = getYear();

    return (
        <div className="select-date">
            <span>{t("date_of_birth")}</span>
            <div className="select-container">
                <Select
                    name="day"
                    value={day}
                    placeholder={t("day")}
                    selectedMonth={Number(displayMonth) || undefined}
                    selectedYear={Number(displayYear) || undefined}
                    onChange={handleDayChange}
                />
                <Select name="month" value={month} placeholder={t("month")} onChange={handleMonthChange} />
                <Select name="year" value={year} placeholder={t("year")} onChange={handleYearChange} />
            </div>
        </div>
    );
}
