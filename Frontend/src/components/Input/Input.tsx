import React, { useState } from "react";
import "./Input.scss";

type InputProps = {
    type?: "text" | "email" | "password" | "checkbox" | "radio" | string;
    name?: string;
    id?: string;
    className?: string;
    placeholder?: string;
    input_title?: string;
    error?: string;
    success?: boolean;
    suffix?: string;
    svg?: string;
    help?: string;
    value?: string;
    checked?: boolean;
    readonly?: boolean;
    maxLength?: number;
    onInput?: (_e: React.FormEvent<HTMLInputElement>) => void;
    onChange?: (_e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function Input({
    type,
    name,
    id,
    className,
    placeholder,
    input_title,
    error,
    success,
    suffix,
    svg,
    value,
    help,
    checked,
    readonly = false,
    maxLength = 100,
    onInput,
    onChange,
}: InputProps) {
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    const isPassword = type === "password";
    const isCheckbox = type === "checkbox";
    const isRadio = type === "radio";
    const inputType = isPassword && showPassword ? "text" : type;

    return (
        <div className="input-container" data-input-name={name}>
            <span className="input__title">{input_title}</span>
            <div className={`input-form ${error ? "error" : ""} ${success ? "success" : ""} ${suffix ? "has-suffix" : ""}`}>
                {svg && <img src={svg} alt="" />}
                <input
                    type={inputType}
                    className={className}
                    id={id}
                    name={name}
                    placeholder={placeholder}
                    onInput={!isCheckbox && !isRadio ? onInput : undefined}
                    onChange={isCheckbox || isRadio ? onChange : undefined}
                    checked={isCheckbox || isRadio ? checked : undefined}
                    readOnly={readonly}
                    maxLength={maxLength}
                    title={help}
                    value={!isCheckbox && !isRadio ? value || "" : undefined}
                />
                {isPassword && <div className={`password-toggle ${!showPassword ? "off" : ""}`} onClick={togglePasswordVisibility} />}
                {suffix && (
                    <span className="input-suffix" aria-hidden="true">
                        {suffix}
                    </span>
                )}
            </div>

            <div className="auth-input__error" data-name={name}>
                {error}
            </div>
        </div>
    );
}
