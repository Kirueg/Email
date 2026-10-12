import React from "react";
import "./Button.scss";

type ButtonProps = {
    svg?: string;
    className?: string;
    size?: number;
    title?: string;
    count?: number;
    block?: boolean;
    isSelect?: boolean;
    active?: boolean;
    type?: "button" | "submit" | "reset";
    name?: string;
    help?: string;
    onClick?: (_event: React.MouseEvent<HTMLButtonElement>) => void;
};

export default function Button({
    svg,
    className,
    size = 20,
    title,
    count,
    block,
    isSelect,
    active,
    type = "button",
    name,
    help,
    onClick,
}: ButtonProps) {
    return (
        <button
            className={className}
            disabled={block}
            data-is-select={isSelect}
            data-active={active ? "true" : "false"}
            type={type}
            name={name}
            title={help || ""}
            onClick={onClick}>
            {svg && <img src={svg} width={size} height={size} alt="" />}
            <span>{title || ""}</span>
            {count != null && count !== 0 && <span className="button-count">{count}</span>}
        </button>
    );
}
