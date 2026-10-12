import Button from "../../components/Button/Button";
import "./Sidebar.scss";
import { AppStorage } from "../../App";
import SidebarProfile from "../../components/SidebarProfile/SidebarProfile";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

interface PropsSidebar {
    isProfile?: number;
    isPress?: number;
    isPressProfile?: number;
    selectedFolderId?: number | null;
    name?: string;
    currentView?: string;
    surname?: string;
    email?: string;
    avatarUrl?: string;
    newMail?: () => void;
    backToMail?: () => void;
    changeProfile?: () => void;
    changePassword?: () => void;
    handleSetting?: () => void;
    handleFolder?: () => void;
    handleSupport?: () => void;
    onNavigate?: () => void;

    updateMail?: () => void;
    handleGetDrafts?: () => void;
    handleGetSendEmail?: () => void;
    handleGetSpam?: () => void;
    handleGetTrash?: () => void;
    handleGetFavorite?: () => void;
    loadEmailFromFolder?: (_offset: number, _folderId: number) => void;
}

export default function Sidebar(props: PropsSidebar) {
    const navigate = useNavigate();

    const [isVisible, setIsVisible] = useState<boolean>(AppStorage.getSidebarDropdownVisible() || false);
    const [unReadCount, setUnReadCount] = useState<number>(AppStorage.unReadCount);
    const [currentView, setCurrentView] = useState<string>(AppStorage.currentView || "inbox");

    useEffect(() => {
        const update = () => {
            setIsVisible(AppStorage.getSidebarDropdownVisible());
            setUnReadCount(AppStorage.unReadCount);
            setCurrentView(AppStorage.currentView || "inbox");
        };
        const unsubscribe = AppStorage.subscribe(update);
        return unsubscribe;
    }, []);

    const toggleDropdown = (event: any) => {
        event.preventDefault();
        const newState = !isVisible;
        setIsVisible(newState);
        AppStorage.setSidebarDropdownVisible(newState);

        const button = event.currentTarget;
        button.classList.toggle("active");
    };

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

    const handleFolderClick = (folderId: number) => {
        AppStorage.setCurrentFolderId(folderId);
        AppStorage.setCurrentView("folder");
        navigate(`/folder/${folderId}`);
        toggleSidebar();
    };

    const handleInboxClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        AppStorage.setCurrentView("inbox");
        AppStorage.setCurrentFolderId(null);
        navigate("/");
        toggleSidebar();
    };

    const handleDraftsClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        AppStorage.setCurrentView("drafts");
        navigate("/drafts");
        toggleSidebar();
    };

    const handleSentClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        AppStorage.setCurrentView("sent");
        navigate("/sent");
        toggleSidebar();
    };

    const handleFavoriteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        AppStorage.setCurrentView("favorite");
        navigate("/favorite");
        toggleSidebar();
    };

    const handleSpamClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        AppStorage.setCurrentView("spam");
        navigate("/spam");
        toggleSidebar();
    };

    const handleTrashClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        AppStorage.setCurrentView("trash");
        navigate("/trash");
        toggleSidebar();
    };

    const handleAllMailClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        AppStorage.setCurrentView("all-emails");
        AppStorage.setCurrentFolderId(null);
        navigate("/all-emails");
        toggleSidebar();
    };

    const t = (key: string) => AppStorage.t(key);

    const {
        isProfile = 0,
        backToMail,
        changeProfile,
        changePassword,
        newMail,
        name,
        surname,
        email,
        avatarUrl,
        handleSetting,
        handleFolder,
        handleSupport,
        selectedFolderId,
    } = props;

    const isMobile = window.innerWidth < 769;

    return (
        <div className="sidebar-widget">
            {isMobile && isProfile === 1 ? (
                <div className="sidebar-settings-back-button-mobile" onClick={backToMail}>
                    {" "}
                    <div className="arrow-left-icon" />
                    <span>{t("back_to_mail")}</span>
                </div>
            ) : null}
            <div
                className="logo-container"
                onClick={(event: any) => {
                    event.preventDefault();
                    handleInboxClick(event);
                }}>
                <img src="../../assets/svg/Logo.svg" />
                <h1 className="logo__title">SMail</h1>
            </div>
            {isProfile !== 1 && (
                <div className="sidebar-content">
                    <div className="main-button">
                        <Button
                            title={t("new_letter")}
                            name="button-new-letter"
                            onClick={(event: any) => {
                                event.preventDefault();
                                newMail?.();
                            }}
                        />
                    </div>
                    <div className="main-button-container">
                        <Button
                            name="button-inbox"
                            title={t("inbox")}
                            isSelect={currentView === "inbox" && !selectedFolderId}
                            count={unReadCount}
                            onClick={handleInboxClick}
                        />

                        <Button name="button-drafs" title={t("drafts")} isSelect={currentView === "drafts"} onClick={handleDraftsClick} />

                        <Button name="button-sends" title={t("sent")} isSelect={currentView === "sent"} onClick={handleSentClick} />

                        <Button
                            name="button-favorites"
                            title={t("starred")}
                            isSelect={currentView === "favorite"}
                            onClick={handleFavoriteClick}
                        />
                    </div>

                    <div className="drop-down">
                        <Button name="button-drop-down" title={isVisible ? t("hide") : t("yet")} onClick={toggleDropdown} />
                        {isVisible && (
                            <div className="extra-button-container">
                                <Button name="button-spam" title={t("spam")} isSelect={currentView === "spam"} onClick={handleSpamClick} />
                                <Button
                                    name="button-trash"
                                    title={t("trash")}
                                    isSelect={currentView === "trash"}
                                    onClick={handleTrashClick}
                                />
                                <Button
                                    name="button-all-letter"
                                    title={t("all_letter")}
                                    isSelect={currentView === "all-emails"}
                                    onClick={handleAllMailClick}
                                />
                                {AppStorage.folders &&
                                    AppStorage.folders.map((folder: any) => (
                                        <div key={folder.id} className="folder-item">
                                            <Button
                                                name="button-folder"
                                                title={folder.name}
                                                isSelect={selectedFolderId === folder.id}
                                                onClick={(event: any) => {
                                                    event.preventDefault();
                                                    handleFolderClick(folder.id);
                                                }}
                                            />
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
            {isProfile === 1 && (
                <div className="sidebar-content">
                    <SidebarProfile name={name} surname={surname} email={email} avatarUrl={avatarUrl} />
                    <div className="main-button-profile">
                        <Button
                            title={t("mailbox")}
                            name="button-back-letter"
                            onClick={(event: any) => {
                                event.preventDefault();
                                backToMail?.();
                            }}
                        />
                    </div>
                    <div className={`main-button-container ${isMobile ? "mobile-tiles" : ""}`}>
                        <Button
                            name="button-profile"
                            title={t("personal_information")}
                            isSelect={props.isPressProfile === 0}
                            onClick={(event: any) => {
                                event.preventDefault();
                                changeProfile?.();
                                toggleSidebar();
                            }}
                        />
                        <Button
                            name="button-security"
                            title={t("security")}
                            isSelect={props.isPressProfile === 1}
                            onClick={(event: any) => {
                                event.preventDefault();
                                changePassword?.();
                                toggleSidebar();
                            }}
                        />
                        <Button
                            name="button-settings"
                            title={t("settings")}
                            isSelect={props.isPressProfile === 2}
                            onClick={(event: any) => {
                                event.preventDefault();
                                handleSetting?.();
                                toggleSidebar();
                            }}
                        />
                        <Button
                            name="button-folder"
                            title={t("folder")}
                            isSelect={props.isPressProfile === 3}
                            onClick={(event: any) => {
                                event.preventDefault();
                                handleFolder?.();
                                toggleSidebar();
                            }}
                        />
                        <Button
                            name="button-support"
                            title={t("support")}
                            isSelect={props.isPressProfile === 4}
                            onClick={(event: any) => {
                                event.preventDefault();
                                handleSupport?.();
                                toggleSidebar();
                            }}
                        />
                    </div>
                </div>
            )}
            {isProfile === 0 ? (
                <SidebarProfile name={name} surname={surname} email={email} avatarUrl={avatarUrl} variant="mobile" textAlign="text-left" />
            ) : null}
        </div>
    );
}
