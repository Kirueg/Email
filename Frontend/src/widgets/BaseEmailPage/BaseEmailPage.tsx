import Sidebar from "../../widgets/Sidebar/Sidebar";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import MailHeader from "../../widgets/MailHeader/MailHeader";
import MailBox from "../../widgets/MailBox/MailBox";
import { getProfile } from "../../api/ApiAuth";
import { readEmail, seacrhEmail, unReadEmail } from "../../api/ApiEmail";
import "./BaseEmailPage.scss";
import ProfileModal from "../../widgets/ProfileModal/ProfileModal";
import SupportModal from "../../widgets/SupportModal/SupportModal";
import { AppStorage } from "../../App";
import { addEmailsInFolder, deleteEmailsFromFolder } from "../../api/ApiFolder";
import { deleteDraft } from "../../api/ApiDraft";
import { trash } from "../../api/ApiTrash";
import { sendFavorite, unFavorite } from "../../api/ApiFavorite";
import { formatTime } from "../../utils/date";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";

interface BaseEmailProps {
    currentView: string;
    fetchEmails: (_offset: number) => Promise<any>;
    deleteEmails?: (_ids: number[]) => Promise<boolean>;
    onReadMail?: (_email: any) => void;
    emptyMessage?: string;
    emptySubMessage?: string;
    showUnreadToggle?: boolean;
    showMarkAsRead?: boolean;
    showMoveToFolder?: boolean;
    currentFolderId?: number | null;
    currentFolderName?: string;
}

export default function BaseEmailPage(props: BaseEmailProps) {
    const navigate = useNavigate();

    const lastFolderId = useRef<number | null>(null);
    const initialLoadDone = useRef(false);

    const [emails, setEmails] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSelectAll, setIsSelectAll] = useState(false);
    const [offset, setOffset] = useState(0);
    const [total, setTotal] = useState(0);
    const [selectedEmails, setSelectedEmails] = useState<Set<number>>(new Set());

    const getSelectedArray = useCallback(() => Array.from(selectedEmails), [selectedEmails]);

    const currentView = AppStorage.currentView || "inbox";

    const {
        fetchEmails,
        currentView: propCurrentView,
        currentFolderId,
        emptyMessage = "",
        emptySubMessage = "",
        showUnreadToggle = false,
        showMarkAsRead = false,
        currentFolderName = "",
    } = props;

    const loadProfile = useCallback(async () => {
        try {
            const data = await getProfile();
            if (data === null) {
                navigate("/login");
            } else {
                AppStorage.setProfileData(data);
                AppStorage.isProfileLoaded = true;
            }
        } catch (error) {
            console.error("Failed to load profile:", error);
            navigate("/login");
        }
    }, [navigate]);

    const loadEmails = useCallback(
        async (offsetValue: number) => {
            if (!AppStorage.email || AppStorage.email === "") return;

            setIsLoading(true);

            if (!fetchEmails) {
                console.warn("fetchEmails prop is missing in BaseEmailPage");
                setIsLoading(false);
                return;
            }

            try {
                const data = await fetchEmails(offsetValue);
                const emailsData = data?.emails || data?.drafts || data || [];
                const list = Array.isArray(emailsData) ? emailsData : [];

                AppStorage.cacheEmails(list);

                setEmails(list);
                setTotal(data?.total ?? list.length);
                setOffset(offsetValue);
                setSelectedEmails(new Set<number>());
                setIsSelectAll(false);
            } catch (error) {
                console.error(`Failed to load ${propCurrentView}:`, error);
            } finally {
                initialLoadDone.current = true;
                setIsLoading(false);
            }
        },
        [fetchEmails, propCurrentView],
    );

    const handleVisibilityChange = useCallback(() => {
        if (!document.hidden && initialLoadDone.current) {
            loadEmails(offset);
        }
    }, [loadEmails, offset]);

    useEffect(() => {
        AppStorage.currentView = currentView;

        if (!AppStorage.isProfileLoaded) {
            loadProfile();
        }
        document.addEventListener("visibilitychange", handleVisibilityChange);
        loadEmails(0);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    useEffect(() => {
        const currentFolderId = props.currentFolderId;

        if (props.currentView === "folder" && currentFolderId !== lastFolderId.current) {
            lastFolderId.current = currentFolderId ?? null;
            loadEmails(0);
        }
    }, [currentFolderId, currentView, loadEmails]);

    const handleAvatar = (event: React.MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleProfileClick = () => {
        setIsModalOpen(false);
        navigate("/profile/personal");
    };

    const handleSettingsClick = () => {
        setIsModalOpen(false);
        AppStorage.setOpenSettingsOnProfile(true);
        navigate("/profile/interface");
    };

    const handleNewMail = () => {
        navigate("/send");
    };

    const handleReadMail = async (email: any) => {
        if (props.currentView === "drafts") {
            navigate("/send");
            return;
        }

        await readEmail([email.id]);

        if (props.currentView === "folder" && currentFolderId != null) {
            AppStorage.setCurrentFolderId(currentFolderId);
            AppStorage.setCurrentView("folder");
        }

        navigate(`/read/${email.id}`);
    };

    const handleTrashSingle = async (emailId: number) => {
        let success = false;
        if (AppStorage.currentView === "drafts") {
            success = await deleteDraft([emailId]);
        } else if (AppStorage.currentView === "folder" && currentFolderId != null) {
            success = await deleteEmailsFromFolder(currentFolderId, [emailId]);
        } else {
            success = await trash([emailId]);
        }

        if (success) {
            await loadEmails(offset);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedEmails.size === 0) return;

        try {
            let success = false;
            if (AppStorage.currentView === "drafts") {
                success = await deleteDraft(getSelectedArray());
            } else if (AppStorage.currentView === "folder" && currentFolderId != null) {
                success = await deleteEmailsFromFolder(currentFolderId, getSelectedArray());
            } else {
                success = await trash(getSelectedArray());
            }

            if (success) {
                await loadEmails(offset);
                setSelectedEmails(new Set<number>());
                setIsSelectAll(false);
            }
        } catch (error) {
            console.error("Error deleting emails:", error);
        }
    };

    const handleToggleReadSingle = async (emailId: number, newReadState: boolean) => {
        if (!showUnreadToggle) return;

        try {
            if (newReadState) {
                await readEmail([emailId]);
            } else {
                await unReadEmail([emailId]);
            }

            setEmails((prev) => prev.map((email: any) => (email.id === emailId ? { ...email, is_read: newReadState } : email)));
        } catch (error) {
            console.error("Error toggling read status:", error);
        }
    };

    const handleToggleFavoriteSingle = async (emailId: number, newState: boolean) => {
        try {
            if (newState) {
                await sendFavorite([emailId]);
            } else {
                await unFavorite([emailId]);
            }

            setEmails((prev) => prev.map((email: any) => (email.id === emailId ? { ...email, is_favorite: newState } : email)));
        } catch (error) {
            console.error("Error toggling favorite:", error);
        }
    };

    const handleMarkAsRead = async () => {
        if (!showMarkAsRead) return;

        const unreadIds = getSelectedArray().filter((selectedId) => {
            const email = emails.find((e) => e.id === selectedId);
            return email && !email.is_read;
        });

        if (unreadIds.length > 0) {
            await readEmail(unreadIds);
            setEmails((prev) => prev.map((email: any) => (unreadIds.includes(email.id) ? { ...email, is_read: true } : email)));
        }
    };

    const handleSelectEmail = (emailId: number) => {
        const currentSet = selectedEmails;
        const newSet = new Set<number>(currentSet);

        if (newSet.has(emailId)) {
            newSet.delete(emailId);
        } else {
            newSet.add(emailId);
        }

        const allSelected = emails.length > 0 && newSet.size === emails.length;

        setSelectedEmails(newSet);
        setIsSelectAll(allSelected);
    };

    const handleSelectAll = (isChecked?: boolean) => {
        if (isChecked) {
            setIsSelectAll(true);
            setSelectedEmails(new Set(emails.map((e: any) => e.id)));
        } else {
            setIsSelectAll(false);
            setSelectedEmails(new Set());
        }
    };

    const hasUnreadSelected = () => {
        return getSelectedArray().some((selectedId: number) => {
            const email = emails.find((e: any) => e.id === selectedId);
            return email && !email.is_read;
        });
    };

    const handleGoToMain = () => {
        if (props.currentView === "inbox") {
            return;
        }
        AppStorage.setCurrentView("inbox");
        AppStorage.clearMailActionData?.();
        AppStorage.setCurrentFolderId?.(null);
        navigate("/");
    };

    const handleSearch = async (data: string) => {
        if (!data || data.trim() === "") return;
        try {
            await seacrhEmail(data);
        } catch (error) {
            console.error("Search failed:", error);
        }
    };

    const t = (key: string) => AppStorage.t(key);

    const toggleSidebar = () => {
        const sidebar = document.querySelector(".sidebar");
        const sidebarOverlay = document.querySelector(".sidebar-overlay");
        if (sidebar) {
            sidebar.classList.toggle("open");
        }
        if (sidebarOverlay) {
            sidebarOverlay.classList.toggle("open");
        }
    };

    const handleMoveToFolder = async (folderId: number) => {
        if (selectedEmails.size === 0 || !folderId) return;

        try {
            await addEmailsInFolder(folderId, getSelectedArray());
            await loadEmails(offset);
            setSelectedEmails(new Set<number>());
            setIsSelectAll(false);
        } catch (error) {
            console.error("Error moving emails to folder:", error);
        }
    };

    const handleSupport = () => {
        const supportModal = document.querySelector(".support-modal");
        if (supportModal) {
            supportModal.classList.toggle("show");
        }
    };
    const selectedArray = getSelectedArray();

    if (!props) {
        return <div>Loading...</div>;
    }

    const mobileHeaderTitle = currentView === "folder" ? currentFolderName : t(currentView);

    return (
        <div className="main-page" onClick={() => handleCloseModal()}>
            <SupportModal />
            <div className="sidebar-overlay" onClick={toggleSidebar}></div>
            <aside className="sidebar">
                <Sidebar
                    isProfile={0}
                    isPress={0}
                    name={AppStorage.name}
                    surname={AppStorage.surname}
                    avatarUrl={AppStorage.getAvatarUrl()}
                    email={AppStorage.email}
                    newMail={handleNewMail}
                    backToMail={handleGoToMain}
                    updateMail={() => loadEmails(offset)}
                    handleGetDrafts={() => navigate("/drafts")}
                    handleGetSendEmail={() => navigate("/sent")}
                    handleGetSpam={() => navigate("/spam")}
                    handleGetTrash={() => navigate("/trash")}
                    handleGetFavorite={() => navigate("/favorite")}
                    loadEmailFromFolder={(offset: number, folderId: number) => {
                        AppStorage.setCurrentFolderId(folderId);
                        navigate(`/folder/${folderId}`);
                    }}
                    selectedFolderId={props.currentFolderId || null}
                    currentView={currentView}
                />
            </aside>
            <div className="right-part">
                <div className="top-bar">
                    <div
                        className="hamburger-btn"
                        onClick={(e: any) => {
                            e.stopPropagation();
                            toggleSidebar();
                        }}>
                        <div className="hamburger-icon" />
                    </div>
                    <div className="search-bar">
                        <Input
                            type="text"
                            placeholder={t("search")}
                            name="search"
                            svg="../../assets/svg/Search.svg"
                            onInput={(e: any) => {
                                handleSearch(e.target.value);
                            }}
                        />
                    </div>
                    <div className="top-right-menu">
                        <div className="support" title="Поддержка" onClick={handleSupport} />
                        <Button svg={AppStorage.getAvatarUrl()} name="avatar" help="Аккаунт" onClick={handleAvatar} />
                    </div>
                </div>
                <div className="mail-box-container__mobile-header">
                    <span>{mobileHeaderTitle}</span>
                </div>
                <div className="mail-box-container">
                    <div className="container-form">
                        <MailHeader
                            onSelectAll={handleSelectAll}
                            isSelectAll={isSelectAll}
                            reloadMail={() => loadEmails(offset)}
                            loadEmail={loadEmails}
                            total={total}
                            offset={offset}
                            selectedCount={selectedArray.length}
                            selectedEmails={selectedArray}
                            hasUnreadSelected={hasUnreadSelected()}
                            onMarkAsRead={handleMarkAsRead}
                            onMoveToFolder={handleMoveToFolder}
                            onDelete={handleDeleteSelected}
                            mainPage={currentView === "inbox"}
                            currentView={currentView}
                            emails={emails}
                            isLoading={isLoading}
                        />
                        {emails.length === 0 && (
                            <div className="mail-box-container-form__placeholder">
                                <div className="mail-box-container-form__placeholder__icon"></div>
                                <span>{emptyMessage || "Нет писем"}</span>
                                {emptySubMessage && <span>{emptySubMessage}</span>}
                            </div>
                        )}
                        {emails.length !== 0 && (
                            <div className="mail-box-container-form">
                                {emails.map((email: any) => {
                                    return (
                                        <MailBox
                                            key={`${email.id}-${email.is_starred}`}
                                            id={email.id}
                                            sender_name={email.sender_name || email.receivers_emails?.[0]}
                                            sender_surname={email.sender_surname}
                                            sender_email={email.sender_email || email.receivers_emails?.[0]}
                                            receivers_emails={currentView === "drafts" ? email.receivers : email.receivers_emails}
                                            theme={email.header}
                                            title={email.body}
                                            date={formatTime(email.created_at)}
                                            isSelected={selectedArray.includes(email.id)}
                                            onSelect={handleSelectEmail}
                                            isRead={email.is_read !== undefined ? email.is_read : true}
                                            isFavorite={email.is_starred !== undefined ? email.is_starred : false}
                                            isAnonymous={email.is_anonymous}
                                            pageMain={currentView === "inbox"}
                                            currentView={currentView}
                                            onClick={() => handleReadMail(email)}
                                            onToggleRead={showUnreadToggle ? handleToggleReadSingle : undefined}
                                            onToggleFavorite={handleToggleFavoriteSingle}
                                            onTrash={handleTrashSingle}
                                            selectedFolderId={props.currentFolderId}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <ProfileModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onProfileClick={handleProfileClick}
                    onSettingsClick={handleSettingsClick}
                />
            </div>
            <Button
                className="button-new-letter-mobile"
                name="button-new-letter-mobile"
                svg="../../assets/svg/Compose.svg"
                onClick={(event: any) => {
                    event.preventDefault();
                    handleNewMail();
                }}
            />
        </div>
    );
}
