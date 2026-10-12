import Button from "../../components/Button/Button";
import "./MailTools.scss";
import { AppStorage } from "../../App";
import { sendSpam, unSpam } from "../../api/ApiSpam";
import { sendFavorite, unFavorite } from "../../api/ApiFavorite";

interface Email {
  id: number;
  is_favorite?: boolean;
  is_spam?: boolean;
}

interface MailToolsProps {
    email?: Email;
    isFavorite?: boolean;
    deleteEmail: () => Promise<void> | void;
    onReply?: () => void;
    onForward?: () => void;
    onFavoriteToggled?: (_isFavorite: boolean) => void;
    backToMail?: () => void;
    reloadMail?: () => void;
}

export default function MailTools(props: MailToolsProps) {
    const handleDeleteClick = async (event: any) => {
        event.preventDefault();
        const { deleteEmail } = props;
        await deleteEmail();
    };

    const handleReplyClick = (event: any) => {
        event.preventDefault();
        const { onReply } = props;
        if (onReply) {
            onReply();
        }
    };

    const handleForwardClick = (event: any) => {
        event.preventDefault();
        const { onForward } = props;
        if (onForward) {
            onForward();
        }
    };

    const handleSpamClick = async (event: any) => {
        event.preventDefault();
        const { email } = props;
        if (email) {
            await sendSpam([email.id]);
            props.backToMail?.();
        }
    };

    const handleUnSpamClick = async (event: any) => {
        event.preventDefault();
        const { email } = props;
        if (email) {
            await unSpam([email.id]);
            props.reloadMail?.();
        }
    };

    const handleFavoriteToggle = async (event: any) => {
        event.preventDefault();
        event.stopPropagation();
        const { email, onFavoriteToggled } = props;

        if (email) {
            if (email.is_favorite) {
                await unFavorite([email.id]);
                onFavoriteToggled?.(false);
            } else {
                await sendFavorite([email.id]);
                onFavoriteToggled?.(true);
            }
        }
    };

    const t = (key: string) => AppStorage.t(key);

    const { email, isFavorite } = props;
    const isSpam = email?.is_spam;

    return (
        <div className="tools-container">
            <div className="tools-left">
                <Button
                    name="favorite"
                    active={isFavorite}
                    help={isFavorite ? t("unstarred") : t("starred")}
                    onClick={handleFavoriteToggle}
                />
                {isSpam ? (
                    <Button name="unspam" help={t("unspam")} onClick={handleUnSpamClick} />
                ) : (
                    <Button name="spam" help={t("spam")} onClick={handleSpamClick} />
                )}
                <Button name="trash" help={t("trash")} onClick={handleDeleteClick} />
            </div>
            <div className="tools-right">
                <Button name="answer" help={t("answer")} title={t("answer")} onClick={handleForwardClick} />
                <Button name="reply" title={t("reply")} help={t("reply")} onClick={handleReplyClick} />
            </div>
        </div>
    );
}
