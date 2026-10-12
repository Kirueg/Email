import { useEffect, useRef } from "react";
import { AppStorage } from "../../App";
import "./Notification.scss";

interface NotificationProps {
    isOpen: boolean;
    onClose: () => void;
    isStatus: boolean;
    message?: string;
    index: number;
}

export default function Notification(props: NotificationProps) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    const popupLength = window.innerWidth < 769 ? 2000 : 4000;


    useEffect(() => {
        if (!props.isOpen) return;

        timerRef.current = setTimeout(() => {
            timerRef.current = null;
            props.onClose();
        }, popupLength);

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [props.isOpen, props.onClose, popupLength]);

    const handleClose = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        props.onClose();
    };

    const t = (key: string) => AppStorage.t(key);

    const { isStatus, message, index } = props;

    const bottomOffset = 40 + index * 60;

    return (
        <div
            className={`confirmation-modal ${isStatus ? "access" : "error"}`}
            onClick={handleClose}
            style={{ bottom: `${bottomOffset}px` }}>
            <div className="__title">{isStatus ? t(message || "saved_successfully") : t(message || "server_error")}</div>
        </div>
    );
}
