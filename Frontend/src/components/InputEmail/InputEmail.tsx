import "./InputEmail.scss";
import { AppStorage } from "../../App";
import { useCallback, useEffect, useRef, useState } from "react";

interface InputEmailProps {
    emails?: string[];
    input_title?: string;
    placeholder?: string;
    onChange?: (_emails: string[], _invalidEmails: string[]) => void;
}

export default function InputEmail(props: InputEmailProps) {
    const { emails: emailsProp, onChange } = props;

    const tagsEl = useRef<HTMLDivElement | null>(null);
    const lastClickTime = useRef(0);
    const lastTapTime = useRef(0);

    const [emails, setEmails] = useState<string[]>(() => emailsProp || [AppStorage.email]);
    const [invalidEmails, setInvalidEmails] = useState<string[]>(() => (emailsProp || [AppStorage.email]).filter((e) => !validateEmail(e)));
    const [currentInput, setCurrentInput] = useState("");
    const [, setError] = useState("");
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editValue, setEditValue] = useState("");

    const updateFadeState = () => {
        const el = tagsEl.current;
        if (!el) return;
        const overflowing = el.scrollWidth > el.clientWidth;
        const isAtEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth;
        const shouldShowFade = overflowing && !isAtEnd;

        if (shouldShowFade) {
            el.classList.add("has-overflow");
        } else {
            el.classList.remove("has-overflow");
        }
    };

    useEffect(() => {
        updateFadeState();
    }, [emails, updateFadeState]);

    const handleTagsScroll = () => {
        updateFadeState();
    };

    const cancelEdit = useCallback(() => {
        setEditingIndex(null);
        setEditValue("");
        setError("");
    }, []);

    const startEditing = useCallback(
        (index: number) => {
            setEditingIndex(index);
            setEditValue(emails[index]);
        },
        [emails],
    );

    const handleTagClick = (index: number) => {
        const now = Date.now();
        if (now - lastClickTime.current < 300) {
            startEditing(index);
        }
        lastClickTime.current = now;
    };

    const commitEdit = () => {
        if (editingIndex === null) return;

        const trimmed = editValue.trim();

        if (!trimmed || trimmed === emails[editingIndex]) {
            cancelEdit();
            return;
        }

        if (!validateEmail(trimmed)) {
            setError("Некорректный email адрес");
            setEditingIndex(null);
            setEditValue("");
            return;
        }

        if (emails.some((e: string, i: number) => i !== editingIndex && e === trimmed)) {
            setError("Такой email уже добавлен");
            return;
        }

        const newEmails = [...emails];
        newEmails[editingIndex] = trimmed;
        const newInvalid = invalidEmails.filter((e: string) => e !== emails[editingIndex]);

        setEmails(newEmails);
        setInvalidEmails(newInvalid);
        setEditingIndex(null);
        setEditValue("");
        setError("");
        props.onChange?.(newEmails, newInvalid);
    };

    const handleEditKeyDown = (e: any) => {
        if (e.key === "Enter") {
            e.preventDefault();
            commitEdit();
        } else if (e.key === "Escape") {
            e.preventDefault();
            cancelEdit();
        }
    };

    const validateEmail = (email: string) => {
        const emailRegex = /^[a-zA-Z0-9._-]+@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    };

    const handleTagDoubleTap = (index: number, e: React.TouchEvent) => {
        if ((e.target as HTMLElement).closest(".remove-email")) return;
        const now = Date.now();
        if (now - lastTapTime.current < 300) {
            e.preventDefault();
            startEditing(index);
        }
        lastTapTime.current = now;
    };

    const addEmail = useCallback(
        (email: string) => {
            const trimmedEmail = email.trim();
            if (!trimmedEmail) return;

            if (!validateEmail(trimmedEmail)) {
                const newEmails = [...emails, trimmedEmail];
                const newInvalid = [...invalidEmails, trimmedEmail];
                setEmails(newEmails);
                setInvalidEmails(newInvalid);
                setCurrentInput("");
                setError("Некорректный email адрес");
                onChange?.(newEmails, newInvalid);
                return;
            }

            if (emails.includes(trimmedEmail)) {
                setError("Такой email уже добавлен");
                return;
            }

            const newEmails = [...emails, trimmedEmail];
            setEmails(newEmails);
            setCurrentInput("");
            setError("");
            onChange?.(newEmails, invalidEmails);
        },
        [emails, invalidEmails, onChange],
    );

    const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
        setCurrentInput((e.target as HTMLInputElement).value);
        setError("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addEmail(currentInput);
        }
    };

    const removeEmail = useCallback(
        (index: number) => {
            const newEmails = [...emails];
            const removedEmail = newEmails[index];
            newEmails.splice(index, 1);

            const newInvalid = invalidEmails.filter((email) => email !== removedEmail);

            setEmails(newEmails);
            setInvalidEmails(newInvalid);
            setError("");
            onChange?.(newEmails, newInvalid);
        },
        [emails, invalidEmails, onChange],
    );

    const handleOnBlur = () => {
        if (currentInput.trim()) {
            addEmail(currentInput);
        }
    };

    const measureTextWidth = (text: string, font: string): number => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d")!;
        context.font = font;
        return context.measureText(text).width;
    };

    const trimEmailToFit = (email: string, maxWidth: number = 240, font: string = "16px system-ui, sans-serif"): string => {
        if (measureTextWidth(email, font) <= maxWidth) return email;

        const atIdx = email.lastIndexOf("@");
        if (atIdx <= 0) {
            let truncated = email;
            while (measureTextWidth(truncated + "...", font) > maxWidth && truncated.length > 0) {
                truncated = truncated.slice(0, -1);
            }
            return truncated + "...";
        }

        const localPart = email.substring(0, atIdx);
        const domain = email.substring(atIdx);

        if (measureTextWidth(domain, font) > maxWidth) {
            return email.substring(0, maxWidth / 8) + "...";
        }

        const remainingWidth = maxWidth - measureTextWidth(domain, font) - measureTextWidth("...", font);
        if (remainingWidth <= 0) return "..." + domain;

        let low = 0,
            high = localPart.length;
        let best = 0;
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const candidate = localPart.substring(0, mid);
            if (measureTextWidth(candidate, font) <= remainingWidth) {
                best = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        const trimmedLocal = localPart.substring(0, best);
        return trimmedLocal + "..." + domain;
    };

    return (
        <div className="input-container">
            <span className="input__title">{props.input_title}</span>
            <div className="input-form">
                <div className="tags-scrollable" ref={tagsEl} onScroll={handleTagsScroll}>
                    {emails.map((email: string, index: number) => {
                        const isInvalid = invalidEmails.includes(email);
                        const isEditing = index === editingIndex;

                        return (
                            <span
                                key={index}
                                className={isInvalid ? "email-tag__error" : "email-tag"}
                                onClick={() => handleTagClick(index)}
                                onTouchEnd={(e) => handleTagDoubleTap(index, e)}>
                                {isEditing ? (
                                    <input
                                        className="edit-input"
                                        value={editValue}
                                        onInput={(e: any) => setEditValue((e.target as HTMLInputElement).value)}
                                        onBlur={commitEdit}
                                        onKeyDown={handleEditKeyDown}
                                        autoFocus
                                    />
                                ) : (
                                    [
                                        <span className="email-text" key="text">
                                            {trimEmailToFit(email)}
                                        </span>,
                                        <button key="remove" type="button" className="remove-email" onClick={() => removeEmail(index)}>
                                            ×
                                        </button>,
                                    ]
                                )}
                            </span>
                        );
                    })}
                </div>
                <input
                    type="text"
                    value={currentInput}
                    onInput={handleInput}
                    onBlur={handleOnBlur}
                    onKeyDown={handleKeyDown}
                    placeholder={props.placeholder}
                    className="email-input"
                />
            </div>
        </div>
    );
}
