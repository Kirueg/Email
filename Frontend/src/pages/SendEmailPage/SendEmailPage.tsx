import Sidebar from "../../widgets/Sidebar/Sidebar";
import Button from "../../components/Button/Button";
import SendMail from "../../widgets/SendMail/SendMail";
import "./SendEmailPage.scss";
import ProfileModal from "../../widgets/ProfileModal/ProfileModal";
import { NotificationManager } from "../../widgets/NotificationManager/NotificationManager";
import Input from "../../components/Input/Input";
import { AppStorage } from "../../App";
import { getProfile } from "../../api/ApiAuth";
import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";

export default function SendEmailPage() {
    const navigate = useNavigate();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [replyData, setReplyData] = useState<any>(null);
    const [forwardData, setForwardData] = useState<any>(null);

    const loadProfile = async () => {
        const data = await getProfile();
        if (data === null) {
            navigate("/login");
            NotificationManager.show(false, "auth_error");
        } else {
            AppStorage.setProfileData(data);
        }
    };

    const loadMailActionData = useCallback(() => {
        const reply = AppStorage.getReplyData();
        const forward = AppStorage.getForwardData();
        setReplyData(reply);
        setForwardData(forward);
    }, []);

    useEffect(() => {
        if (!AppStorage.isProfileLoaded) {
            AppStorage.isProfileLoaded = true;
            loadProfile();
        }
        loadMailActionData();
    }, [loadProfile, loadMailActionData]);

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
        navigate("/profile");
    };

    const handleNewMail = () => {
        AppStorage.clearMailActionData();
        setReplyData(null);
        setForwardData(null);
    };

    const handleBackToMail = () => {
        AppStorage.clearMailActionData();
        AppStorage.setCurrentFolderId(null);
        AppStorage.setCurrentView("inbox");
        navigate("/");
    };

    // const handleBackToSent = () => {
    //     AppStorage.clearMailActionData();
    //     AppStorage.setCurrentFolderId(null);
    //     AppStorage.setCurrentView("sent");
    //     navigate("/sent");
    // };

    const handleGetSendEmail = () => {
        AppStorage.setCurrentView("sent");
        navigate("/sent");
    };

    const handleGetDrafts = () => {
        AppStorage.setCurrentView("drafts");
        navigate("/");
    };

    const handleGetSpam = () => {
        AppStorage.setCurrentView("spam");
        navigate("/");
    };

    const handleGetTrash = () => {
        AppStorage.setCurrentView("trash");
        navigate("/");
    };

    const handleGetFavorite = () => {
        AppStorage.setCurrentView("favorite");
        navigate("/");
    };

    const handleGoToMain = () => {
        AppStorage.setCurrentView("inbox");
        AppStorage.clearMailActionData();
        AppStorage.setCurrentFolderId(null);
        navigate("/");
    };

    const loadEmailFromFolder = async (folderID: number) => {
        AppStorage.setCurrentFolderId(folderID);
        AppStorage.setCurrentView("folder");
        navigate("/");
    };

    const t = (key: string): string => AppStorage.t(key);

    const mailActionData = replyData || forwardData;

    return (
        <div className="send-email-page" onClick={() => handleCloseModal()}>
            <aside className="sidebar">
                <Sidebar
                    isProfile={0}
                    isPress={0}
                    newMail={handleNewMail}
                    backToMail={handleGoToMain}
                    updateMail={handleGoToMain}
                    handleGetDrafts={handleGetDrafts}
                    handleGetSendEmail={handleGetSendEmail}
                    handleGetSpam={handleGetSpam}
                    handleGetTrash={handleGetTrash}
                    handleGetFavorite={handleGetFavorite}
                    loadEmailFromFolder={loadEmailFromFolder}
                />
            </aside>
            <div className="right-part">
                <div className="top-bar">
                    <div className="search-bar">
                        <Input type="text" placeholder={t("search")} name="search" svg="../../assets/svg/Search.svg" onInput={() => {}} />
                    </div>

                    <div className="top-right-menu">
                        <Button svg={AppStorage.getAvatarUrl()} name="avatar" help="Аккаунт" onClick={handleAvatar} />
                    </div>
                </div>
                <div className="mail-box-container">
                    <SendMail backToMail={handleBackToMail} actionData={mailActionData} />
                </div>
                <ProfileModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onProfileClick={handleProfileClick}
                    onSettingsClick={() => {
                        setIsModalOpen(false);
                        navigate("/profile/interface");
                    }}
                />{" "}
            </div>
        </div>
    );
}
