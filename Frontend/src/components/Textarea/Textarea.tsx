import "./Textarea.scss";

interface TextareaProps {
    value?: string;
    placeholder?: string;
    input_title?: string;
    className?: string;
    readonly?: boolean;
    type?: string;
    onInput?: (_e: React.FormEvent<HTMLTextAreaElement>) => void;
    onChange?: (_e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export default function Textarea(props: TextareaProps) {
    const handleInput = (e: any) => {
        if (props.onInput) {
            props.onInput(e);
        }
    };

    return (
        <div className="text-area">
            <span className="input__title">{props.input_title}</span>
            <textarea
                className={props.className}
                readOnly={props.readonly}
                value={props.value || ""}
                placeholder={props.placeholder}
                onInput={handleInput}
            />
        </div>
    );
}
