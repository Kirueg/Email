import Button from "../../components/Button/Button";
import { AppStorage } from "../../App";
import "./ConfirmationDialog.scss";

interface ConfirmationDialogProps {
    text?: string;
    cancelButtonTitle?: string;
    confirmButtonTitle?: string;
    highlightCancel?: boolean;
    callbackConfirm: () => void;
    callbackCancel: () => void;
}

export default function ConfirmationDialog(props: ConfirmationDialogProps) {
    const onConfirm = () => {
        props.callbackConfirm();
    };

    const onCancel = () => {
        props.callbackCancel();
    };

    const t = (key: string) => AppStorage.t(key);

    const { text, cancelButtonTitle, confirmButtonTitle, highlightCancel } = props;
    return (
        <div className="confirmation-dialog">
            <div className="__overlay" />
            <div className="__content">
                <h2>{text}</h2>
                <div className="__buttons">
                    <Button
                        className={highlightCancel ? "primary" : "secondary"}
                        title={t(cancelButtonTitle || "action_cancel")}
                        onClick={onCancel}
                    />
                    <Button
                        className={!highlightCancel ? "primary" : "secondary"}
                        title={t(confirmButtonTitle || "action_confirm")}
                        onClick={onConfirm}
                    />
                </div>
            </div>
        </div>
    );
}
