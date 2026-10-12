import { AppStorage } from "../../App";
import "./MailBox.scss";

interface PropsMailBox {
    id: number;
    theme?: string;
    sender_name?: string;
    sender_surname?: string;
    sender_email?: string;
    receivers_emails?: string[];
    title?: string;
    date?: string;
    onClick?: () => void;
    isSelected?: boolean;
    pageMain?: boolean;
    isRead?: boolean;
    currentView?: string;
    isFavorite?: boolean;
    isAnonymous?: boolean;
    onSelect?: (_id: number) => void;
    onToggleRead?: (_id: number, _newReadState: boolean) => void;
    onToggleFavorite?: (_id: number, _newState: boolean) => void;
    onTrash?: (_id: number) => void;
    selectedFolderId?: number | null;
}

export default function MailBox(props: PropsMailBox) {
    const handleSelect = (e: any) => {
        e.stopPropagation();
        const { id, onSelect } = props;

        if (onSelect) {
            onSelect(id);
        }
    };

    const handleToggleRead = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        const { id, isRead, onToggleRead } = props;

        if (onToggleRead) {
            onToggleRead(id, !isRead);
        }
    };

    const handleFavorite = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        props.onToggleFavorite?.(props.id, e.target.checked);
    };

    const trimEmailAddress = (email?: string): string => {
        if (!email) return "";
        return email.substring(0, email.lastIndexOf("@"));
    };

    const t = (key: string) => AppStorage.t(key);

    const {
        theme = "",
        sender_name,
        sender_surname,
        sender_email,
        receivers_emails,
        title = "",
        date = "",
        onClick,
        isSelected = false,
        pageMain = false,
        isRead = true,
        currentView = "",
        isFavorite = false,
        isAnonymous = false,
    } = props;

    const isMobile = window.innerWidth < 769;
    const isSentView = currentView === "sent";
    const isDraftsView = currentView === "drafts";
    const showSenderInfo = !isSentView && (sender_name || sender_email);
    const showFavoriteCheckbox = !isSentView && !isDraftsView;

    let sentToString = t("no_recipient");
    if (receivers_emails) {
        sentToString = "To: " + receivers_emails.join(", ");
    }

    return (
        <div className={`mail ${isSelected ? "selected" : ""} ${isRead ? "read" : ""} ${isFavorite ? "favorite" : ""}`} onClick={onClick}>
            <div className="checkbox-container">
                <input
                    type="checkbox"
                    className={`select-checkbox ${isSelected ? "selected" : ""}`}
                    name="select-checkbox"
                    checked={isSelected}
                    onChange={handleSelect}
                    onClick={(e: any) => e.stopPropagation()}
                />
                {showFavoriteCheckbox && (
                    <input
                        type="checkbox"
                        className="favorites-checkbox"
                        name="favorites-checkbox"
                        checked={isFavorite}
                        onChange={handleFavorite}
                        onClick={(e: any) => e.stopPropagation()}
                    />
                )}
            </div>
            <div className="mail-content">
                <div className="mail-content__left-part">
                    <span className="mail-sender" title={t("from") + " " + sender_email}>
                        {pageMain && (
                            <input
                                type="checkbox"
                                name="read-checkbox"
                                className={`read-checkbox ${isRead ? "read" : ""}`}
                                checked={isRead}
                                onChange={handleToggleRead}
                                onClick={(e: any) => e.stopPropagation()}
                            />
                        )}
                        {!pageMain && <div className="sent-checkbox"></div>}
                        {isSentView || isDraftsView
                            ? sentToString
                            : showSenderInfo
                              ? sender_name
                                  ? `${sender_name} ${sender_surname || ""}`.trim()
                                  : trimEmailAddress(sender_email)
                              : isAnonymous
                                ? t("anonymous")
                                : t("no_recipient")}
                    </span>
                    {}
                    {!isMobile ? (
                        <div className="mail-text-content">
                            <span className="mail-theme" data-mail-theme={props.id}>
                                {theme !== "" ? theme : t("empty_subject")}
                                <span className="mail-title"> - {title}</span>
                            </span>
                            <span className="mail-date">
                                <span className="mail-date__text">{date}</span>
                                <div className="mail-date__actions">
                                    <div
                                        className="action-btn action-btn--read"
                                        onClick={(e: any) => {
                                            e.stopPropagation();
                                            props.onToggleRead?.(props.id, !props.isRead);
                                        }}
                                        title={props.isRead ? t("mark_as_unread") : t("mark_as_read")}
                                    />
                                    <div
                                        className="action-btn action-btn--trash"
                                        onClick={(e: any) => {
                                            e.stopPropagation();
                                            props.onTrash?.(props.id);
                                        }}
                                        title={t("trash")}
                                    />
                                </div>
                            </span>
                        </div>
                    ) : (
                        <div className="mail-text-content">
                            <span className="mail-theme">{theme !== "" ? theme : t("empty_subject")}</span>
                            <span className="mail-title">{title}</span>
                            <span className="mail-date">{date}</span>
                        </div>
                    )}
                </div>
                <div className="mail-content__right-part-mobile">
                    <span className="mail-date-mobile">{date}</span>
                    {showFavoriteCheckbox && (
                        <input
                            className="favorites-checkbox-mobile"
                            type="checkbox"
                            name="favorites-checkbox"
                            checked={isFavorite}
                            onChange={handleFavorite}
                            onClick={(e: any) => e.stopPropagation()}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
