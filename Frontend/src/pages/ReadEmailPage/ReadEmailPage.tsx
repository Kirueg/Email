import "./ReadEmailPage.scss";
import { AppStorage } from "../../App";
import Sidebar from "../../widgets/Sidebar/Sidebar";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import ProfileModal from "../../widgets/ProfileModal/ProfileModal";
import ReadMail from "../../widgets/ReadMail/ReadMail";
import { getEmailByID } from "../../api/ApiEmail";
import { useLocation, useNavigate } from "react-router-dom";
import React, { useCallback, useEffect, useState } from "react";

interface EmailState {
    id: number;
    header: string;
    body: string;
    createdAt: string;
    senderEmail: string;
    senderImage: string;
    senderName: string;
    senderSurname: string;
    receiverList: string[];
    is_anonymous?: boolean;
    is_favorite?: boolean;
}

export default function ReadEmailPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState<EmailState>({
        id: 0,
        header: "",
        body: "",
        createdAt: "",
        senderEmail: "",
        senderImage: "",
        senderName: "",
        senderSurname: "",
        receiverList: [],
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [, setIsPress] = useState(0);
    const [selectedFolderId] = useState<number | null>(() => AppStorage.getCurrentFolderId?.() ?? null);

    const loadEmail = useCallback(
        async (id: number) => {
            if (!id) {
                navigate("/");
                return;
            }

            const data = await getEmailByID(id);
            if (!data) {
                navigate("/");
                return;
            }

            AppStorage.cacheSingleEmail(data);

            const fromSent = (location.state as any)?.from === "sent";
            setIsPress(fromSent ? 1 : 0);

            setEmail({
                id: data.id,
                header: data.header || "",
                body: data.body || "",
                createdAt: data.created_at || "",
                senderEmail: data.sender_email || "",
                senderImage: data.sender_image_path || "",
                senderName: data.sender_name || "",
                senderSurname: data.sender_surname || "",
                receiverList: data.receiver_list || [],
                is_anonymous: data.is_anonymous,
                is_favorite: data.is_favorite,
            });
        },
        [navigate, location.state],
    );

    useEffect(() => {
        const strID = location.pathname.split("/").pop();
        const id = strID ? parseInt(strID, 10) : 0;
        loadEmail(id);
    }, [location.pathname, loadEmail]);

    const handleAvatar = (event: React.MouseEvent<HTMLButtonElement>) => {
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

    const handleGetDrafts = () => {
        AppStorage.setCurrentView("drafts");
        navigate("/");
    };

    const handleGetSendEmail = () => {
        AppStorage.setCurrentView("sent");
        navigate("/sent");
    };

    const handleGoToMain = () => {
        AppStorage.setCurrentView("inbox");
        AppStorage.clearMailActionData();
        AppStorage.setCurrentFolderId(null);
        navigate("/");
    };

    const handleNewMail = () => {
        navigate("/send");
    };

    const handleBackToMail = () => {
        AppStorage.clearMailActionData();
        AppStorage.setCurrentFolderId(null);
        navigate("/");
    };

    const handleBackToSent = () => {
        AppStorage.clearMailActionData();
        AppStorage.setCurrentFolderId(null);
        navigate("/sent");
    };

    const loadEmailFromFolder = async (offset: number, folderID: number) => {
        AppStorage.setCurrentFolderId(folderID);
        AppStorage.setCurrentView("folder");
        navigate("/");
    };

    const handleFavoriteToggled = (newIsFavorite: boolean) => {
        setEmail((prev) => ({ ...prev, is_favorite: newIsFavorite }));
    };

    const t = (key: string): string => AppStorage.t(key);

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
                    <ReadMail
                        key={email.id}
                        email={email}
                        backToMail={handleBackToMail}
                        backToSent={handleBackToSent}
                        selectedFolderId={selectedFolderId}
                        onFavoriteToggled={handleFavoriteToggled}
                    />
                </div>

                <ProfileModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onProfileClick={handleProfileClick}
                    onSettingsClick={() => {
                        setIsModalOpen(false);
                        navigate("/profile/interface");
                    }}
                />
            </div>
        </div>
    );
}
