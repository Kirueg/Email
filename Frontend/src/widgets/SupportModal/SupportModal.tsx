import { useEffect } from "react";
import "./SupportModal.scss";

export default function SupportModal() {
    useEffect(() => {
        window.addEventListener("message", handleMessage);
        return removeEventListener("message", handleMessage);
    }, []);

    const handleMessage = (event: MessageEvent) => {
        if (event.data.action === "closeSupportModal") {
            closeModal();
        }
    };

    const closeModal = () => {
        const supportModal = document.querySelector(".support-modal");
        if (supportModal) {
            supportModal.classList.toggle("show");
            if (!supportModal.classList.contains("show")) {
                const iframe = document.querySelector(".support-iframe") as HTMLIFrameElement;
                if (iframe) iframe.src = iframe.src;
            }
        }
    };

    const url = new URL(document.URL);
    return (
        <div className="support-modal">
            <div className="support-modal-overlay" onClick={closeModal}></div>
            <iframe className="support-iframe" src={`${url.origin}/support`} height="200" width="200"></iframe>
        </div>
    );
}
