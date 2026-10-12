import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";
import "./MailHeader.scss";
import { AppStorage } from "../../App";
import { getEmailsSpam, sendSpam, unSpam } from "../../api/ApiSpam";
import { sendFavorite, unFavorite } from "../../api/ApiFavorite";
import { getEmailsTrash, untrash } from "../../api/ApiTrash";
import { readEmail, unReadEmail } from "../../api/ApiEmail";
import { useState } from "react";

interface Email {
    id: number;
    is_favorite: boolean;
    is_read?: boolean;
}

interface PropsMailHeader {
    onSelectAll: (_isChecked: boolean) => void;
    loadEmail: (_offset: number) => void;
    onMoveToFolder?: (_folderId: number) => void;
    reloadMail: () => void;
    onMarkAsRead?: () => void;
    onDelete?: () => void;
    isLoading: boolean;
    emails: Email[];
    selectedCount: number;
    hasUnreadSelected: boolean;
    selectedEmails: number[];
    offset: number
    total: number;
    currentView: string;
    isSelectAll: boolean;
    mainPage?: boolean;
}

export default function MailHeader(props: PropsMailHeader) {
    const [showFolderList, setShowFolderList] = useState(false);

    const handleSelectAll = (e: any) => {
        const isChecked = e && e.target ? e.target.checked : false;
        props.onSelectAll(isChecked);
    };

    const handlePrevPage = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        const { offset } = props;
        const newOffset = Math.max(0, offset - 50);
        props.loadEmail(newOffset);
    };

    const handleNextPage = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        const { offset, total } = props;
        const newOffset = offset + 50;
        if (newOffset < total) {
            props.loadEmail(newOffset);
        }
    };

    const handleMoveToFolder = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setShowFolderList(!showFolderList);
    };

    const handleFolderSelect = (folderId: number, e: any) => {
        e.stopPropagation();
        setShowFolderList(!false);
        if (props.onMoveToFolder) {
            props.onMoveToFolder(folderId);
        }
    };

    const handleMarkAsSpam = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        if (props.selectedEmails && props.selectedEmails.length > 0) {
            await sendSpam(props.selectedEmails);
            props.reloadMail?.();
        }
    };

    const handleMarkAsFavorite = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        if (props.selectedEmails && props.selectedEmails.length > 0) {
            await sendFavorite(props.selectedEmails);
            props.reloadMail?.();
        }
    };

    const handleUnMarkAsFavorite = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        if (props.selectedEmails && props.selectedEmails.length > 0) {
            await unFavorite(props.selectedEmails);
            props.reloadMail?.();
        }
    };

    const handleMarkAsRead = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        if (props.selectedEmails && props.selectedEmails.length > 0) {
            await readEmail(props.selectedEmails);
            props.onMarkAsRead?.();
            props.reloadMail?.();
        }
    };

    const handleMarkAsUnread = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        if (props.selectedEmails && props.selectedEmails.length > 0) {
            await unReadEmail(props.selectedEmails);
            props.reloadMail?.();
        }
    };

    const handleMoveToInbox = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        if (props.selectedEmails && props.selectedEmails.length > 0) {
            const { currentView } = props;

            if (currentView === "trash") {
                await untrash(props.selectedEmails);
                await getEmailsTrash(0);
            } else if (currentView === "spam") {
                await unSpam(props.selectedEmails);
                await getEmailsSpam(0);
            }
            props.reloadMail?.();
        }
    };

    // const handleClickOutside = () => {
    //     setShowFolderList(false);
    // };

    const t = (key: string) => AppStorage.t(key);

    const hasReadSelected = () => {
        const { selectedEmails } = props;
        if (!selectedEmails) return false;
        const { emails } = props;
        if (!emails) return false;
        return selectedEmails.some((selectedId: number) => {
            const email = emails.find((e: any) => e.id === selectedId);
            return email && email.is_read;
        });
    };

    const isFavoriteSelected = () => {
        const { selectedEmails } = props;
        if (!selectedEmails) return false;
        const { emails } = props;
        if (!emails) return false;
        return selectedEmails.some((selectedId: number) => {
            const email = emails.find((e: any) => e.id === selectedId);
            return email && email.is_favorite;
        });
    };

    const { isSelectAll, offset = 0, total = 0, mainPage = false, currentView = "", isLoading } = props;
    const startItem = total > 0 ? offset + 1 : 0;
    const endItem = Math.min(offset + 50, total);
    const hasSelected = props.selectedCount > 0;
    const isSpamOrTrash = currentView === "spam" || currentView === "trash";
    const isDrafts = currentView === "drafts";
    const isMobile = window.innerWidth < 769;
    const isSent = currentView === "sent";
    const readSelected = hasReadSelected();
    const favoriteSelected = isFavoriteSelected();
    const hasOnlyUnread = hasSelected && !readSelected;

    const folders = AppStorage.folders || [];

    return (
        <div className="mail-header">
            <div className="mail-header__left-container">
                <div className="left-container__select-all">
                    <Input
                        type="checkbox"
                        className={`checkbox-all ${isSelectAll ? "isSelect" : ""}`}
                        name="checkbox-all"
                        help="Выбрать все"
                        checked={isSelectAll}
                        onChange={handleSelectAll}
                    />
                    <Button
                        name="arrow-down"
                        help="Выбрать"
                        onClick={(event: any) => {
                            event.preventDefault();
                        }}
                    />
                </div>

                {!hasSelected && (
                    <Button
                        name="refresh"
                        className={isLoading ? "refreshing" : ""}
                        block={isLoading}
                        help={t("refresh")}
                        onClick={(event: any) => {
                            event.preventDefault();
                            props.reloadMail();
                        }}
                    />
                )}

                {hasSelected && (
                    <div className="select-all-container">
                        <div className={`select-all__tools-left${isDrafts || isSent || isSpamOrTrash ? " hide-separator" : ""}`}>
                            {isSpamOrTrash && <Button name="move-to-inbox" help={t("move_to_inbox")} onClick={handleMoveToInbox} />}

                            {!isSpamOrTrash && !isDrafts && (
                                <div className="select-all-container">
                                    {favoriteSelected ? (
                                        <Button name="unfavorite" help={t("unstarred")} onClick={handleUnMarkAsFavorite} />
                                    ) : (
                                        <Button name="favorites" help={t("starred")} onClick={handleMarkAsFavorite} />
                                    )}
                                    {!isSent && <Button name="spam" help={t("spam")} onClick={handleMarkAsSpam} />}
                                </div>
                            )}

                            <Button
                                name="trash"
                                help={t("trash")}
                                onClick={(event: any) => {
                                    event.preventDefault();
                                    if (props.onDelete) {
                                        props.onDelete();
                                    }
                                }}
                            />
                        </div>
                        <div className="select-all__tools-right">
                            {mainPage && !isSpamOrTrash && !isDrafts && (
                                <>
                                    {hasOnlyUnread ? (
                                        <Button name="read-all-mail" help={t("mark_as_read")} onClick={handleMarkAsRead} />
                                    ) : readSelected ? (
                                        <Button name="unread-all-mail" help={t("mark_as_unread")} onClick={handleMarkAsUnread} />
                                    ) : null}
                                </>
                            )}
                            {mainPage && !isSpamOrTrash && !isDrafts && (
                                <div className="move-to-folder-container">
                                    <Button name="move-to-folder" help={t("move_to_folder")} onClick={handleMoveToFolder} />
                                    {showFolderList && (
                                        <div className="folder-dropdown">
                                            {folders.length > 0 ? (
                                                folders.map((folder: any) => (
                                                    <div
                                                        key={folder.id}
                                                        className="folder-dropdown__item"
                                                        onClick={(e: any) => handleFolderSelect(folder.id, e)}>
                                                        {folder.name}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="folder-dropdown__item folder-dropdown__item--empty">
                                                    Нет доступных папок
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            {!isMobile || !hasSelected ? (
                <div className="mail-header__right-container">
                    <div className="count-email">
                        {startItem} - {endItem} {t("of")} {total}
                    </div>
                    <Button name="left" help="Пред." block={offset === 0} onClick={handlePrevPage} />
                    <Button name="right" help="След." block={offset + 50 >= total} onClick={handleNextPage} />
                </div>
            ) : null}
        </div>
    );
}
