import "./ReadMail.scss";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import Textarea from "../../components/Textarea/Textarea";
import HorizontalScroller from "../../components/HorizontalScroller/HorizontalScroller";
import MailTools from "../MailTools/MailTools";
import { AppStorage } from "../../App";
import { URLMINIO } from "../../api/config";
import { deleteEmailsFromFolder } from "../../api/ApiFolder";
import { trash } from "../../api/ApiTrash";
import { formatTime } from "../../utils/date";
import { getAttachments, downloadAttachment } from "../../api/ApiAttachments";
import { formatFileSize, getIconByContentType, trimFileName } from "../../utils/files";
import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";

interface Email {
    id: number;
    header?: string;
    body?: string;
    senderEmail?: string;
    senderImage?: string;
    receiverList?: string[];
    createdAt?: string;
    is_anonymous?: boolean;
    is_favorite?: boolean;
}

interface ReadMailProps {
    email: Email;
    backToMail: () => void;
    backToSent?: () => void;
    reloadMail?: () => void;
    onFavoriteToggled?: (_isFavorite: boolean) => void;
    selectedFolderId?: number | null;
}

export default function ReadMail(props: ReadMailProps) {
    const navigate = useNavigate();

    const { email } = props;

    const [attachments, setAttachments] = useState<any[]>([]);
    const [, setAttachmentsLoading] = useState(false);
    // const [isFavorite, setIsFavorite] = useState<boolean>(email?.is_favorite ?? false);

    const fetchAttachments = useCallback(async () => {
        if (!email?.id) return;

        setAttachmentsLoading(true);
        try {
            const data = await getAttachments(email.id);

            let attachmentsArray: any[] = [];
            if (Array.isArray(data)) {
                attachmentsArray = data;
            } else if (data && Array.isArray(data.attachments)) {
                attachmentsArray = data.attachments;
            } else if (data && typeof data === "object") {
                attachmentsArray = [data];
            }

            setAttachments(attachmentsArray);
        } catch {
            setAttachments([]);
        } finally {
            setAttachmentsLoading(false);
        }
    }, [email?.id]);

    useEffect(() => {
        fetchAttachments();
    }, [fetchAttachments]);

    const handleDownload = async (attachmentId: number, fileName: string) => {
        const { email } = props;
        if (!email?.id) return;

        try {
            const blob = await downloadAttachment(email.id, attachmentId);
            if (!blob) return;

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch {}
    };

    const handleCloseEmail = () => {
        navigate("/");
    };

    const handleDeleteEmail = async () => {
        const { email, backToMail, backToSent, selectedFolderId } = props;

        if (selectedFolderId) {
            const ids = [email.id];
            await deleteEmailsFromFolder(selectedFolderId, ids);
            backToMail();
        } else if (backToSent) {
            await trash([email.id]);
            backToSent();
        } else {
            await trash([email.id]);
            backToMail();
        }
    };

    const handleReply = () => {
        const { email } = props;

        AppStorage.setReplyData({
            type: "reply",
            to: email.senderEmail || "",
            subject: `Re: ${email.header}`,
            body: `\n\n${t("original_email")}\n${t("from")} ${email.is_anonymous ? t("anonymous") : email.senderEmail || ""}\n${t("date")} ${email.createdAt ? new Date(email.createdAt).toLocaleString("ru-RU") : t("unknown")} \n\n${email.body}`,
            originalEmail: email,
        });

        AppStorage.replyingToAnonymous = email.is_anonymous ?? false;
        AppStorage.emailReplyingId = email.id;

        navigate("/send");
    };

    const handleForward = () => {
        const { email } = props;

        AppStorage.setForwardData({
            type: "forward",
            subject: `Fwd: ${email.header || "Без темы"}`,
            body: `\n\n${t("forwarded_email")}\n${t("from")} ${email.senderEmail}\n${t("date")} ${email.createdAt ? new Date(email.createdAt).toLocaleString("ru-RU") : t("unknown")}\n${t("subject")} ${email.header || t("empty_subject")}\n${t("to")} ${email.receiverList}\n\n${email.body || ""}`,
            originalEmail: email,
        });

        navigate("/send");
    };

    const t = (key: string) => AppStorage.t(key);

    const isMobile = window.innerWidth < 769;
    const hasAttachments = attachments.length > 0;

    return (
        <div className="read-mail">
            {isMobile ? (
                <div className="read-mail__header-mobile">
                    <div className="back-button" onClick={props.backToMail}></div>

                    <MailTools
                        deleteEmail={handleDeleteEmail}
                        onReply={handleReply}
                        onForward={handleForward}
                        email={email}
                        reloadMail={props.reloadMail}
                        backToMail={props.backToMail}
                    />
                </div>
            ) : null}
            <form action="" className="read-form">
                <div className="read-inputs">
                    <div className="read-header">
                        <div className="sender-avatar">
                            <img src={email.senderImage !== "" ? `${URLMINIO}/${email.senderImage}` : "/assets/svg/Avatar.svg"} />
                        </div>
                        <div className="sender-data">
                            <div className="sender__email">
                                <span>{email.is_anonymous ? t("anonymous") : email.senderEmail}</span>
                                {isMobile ? <div className="email-send-time">{formatTime(email.createdAt || "")}</div> : null}
                            </div>
                            <div className="recivers__emails">
                                {t("to")}
                                <div className="input-form">
                                    {(email.receiverList || []).map((email: string, index: number) => (
                                        <span key={index} className="email-tag">
                                            <span>{email}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {!isMobile ? (
                            <div className="top-right-bar">
                                <span className="email-send-time">{formatTime(email.createdAt || "")}</span>
                                <div className="close-button" onClick={handleCloseEmail} />
                            </div>
                        ) : null}
                    </div>
                    <Input
                        type="text"
                        placeholder={t("empty_subject")}
                        input_title={t("subject")}
                        name="theme"
                        readonly={true}
                        value={email.header}
                        onInput={() => {}}
                    />
                </div>
                <div className={`attachments-section${hasAttachments ? "" : " hidden"}`}>
                    <HorizontalScroller className="attachments-list">
                        {attachments.map((att: any) => (
                            <div className="attachment-item">
                                <div className={`attachment-icon ${getIconByContentType(att.content_type)}`} />
                                <div className="attachment-info">
                                    <span className="attachment-name">{trimFileName(att.file_name)}</span>
                                    <span className="attachment-size">{formatFileSize(att.size_bytes)}</span>
                                </div>
                                <div
                                    className="attachment-download-btn"
                                    onClick={(e: any) => {
                                        e.preventDefault();
                                        handleDownload(att.id, att.file_name);
                                    }}></div>
                            </div>
                        ))}
                    </HorizontalScroller>
                </div>
                <Textarea readonly={true} value={email.body} />
            </form>
            {!isMobile ? (
                <MailTools
                    deleteEmail={handleDeleteEmail}
                    onReply={handleReply}
                    onForward={handleForward}
                    email={email}
                    reloadMail={props.reloadMail}
                    backToMail={props.backToMail}
                    onFavoriteToggled={props.onFavoriteToggled}
                    isFavorite={email.is_favorite}
                />
            ) : (
                <div className="tools-bottom-mobile">
                    <Button svg="../../assets/svg/Reply.svg" className="reply" help="Переслать" onClick={handleForward} />
                    <Button svg="../../assets/svg/Answer.svg" className="answer" help="Ответить" onClick={handleReply} />
                </div>
            )}
        </div>
    );
}
