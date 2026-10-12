import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfilePage.scss";
import Sidebar from "../../widgets/Sidebar/Sidebar";
import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";
import UploadAvatar from "../../components/UploadAvatar/UploadAvatar";
import Textarea from "../../components/Textarea/Textarea";
import { validation } from "../../utils/validation";
import { changePassword, getProfile, changeProfile } from "../../api/ApiAuth";
import { getMyTickets, getMessages, answerTicket } from "../../api/ApiSupport";
import { AppStorage } from "../../App";
import ProfileModal from "../../widgets/ProfileModal/ProfileModal";
import SelectDate from "../../components/SelectDate/SelectDate";
import FolderChange from "../../widgets/FolderChange/FolderChange";
import { NotificationManager } from "../../widgets/NotificationManager/NotificationManager";
import SupportModal from "../../widgets/SupportModal/SupportModal";
import { requestNotificationPermission } from "../../utils/emailNotifications";

type Errors = Record<string, string | undefined>;
type Touched = Record<string, boolean>;

interface State {
    errors: Errors;
    touched: Touched;
    name: string;
    surname: string;
    email: string;
    is_male: boolean;
    folders: any[];
    oldPassword: string;
    newPassword: string;
    profileState: number;
    avatarKey: number;
    avatarUrl: string;
    isModalOpen: boolean;
    isConfirm: boolean;
    isStatus: boolean;
    language: "ru" | "en";
    birthDay: string;
    birthMonth: string;
    birthYear: string;
    isFolderEditMode: boolean;
    message: string | null;
    supportTickets: any[];
    selectedTicketId: number | null;
    chatMessages: any[];
    chatInputText: string;
    showNewTicketForm: boolean;
    newTicketSubject: string;
    newTicketMessage: string;
    mobileChatOpen: boolean;
}

export default function ProfilePage() {
    const navigate = useNavigate();

    const unsubscribeRef = useRef<(() => void) | null>(null);
    const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const t = useCallback((key: string) => AppStorage.t(key), []);

    const [state, setState] = useState<State>(() => {
        const shouldOpenSettings = AppStorage.getOpenSettingsOnProfile();
        return {
            errors: {},
            touched: {},
            name: AppStorage.name,
            surname: AppStorage.surname,
            email: AppStorage.email,
            is_male: AppStorage.is_male,
            folders: AppStorage.folders,
            oldPassword: "",
            newPassword: "",
            profileState: shouldOpenSettings ? 2 : 0,
            avatarKey: 0,
            avatarUrl: AppStorage.getAvatarUrl(),
            isModalOpen: false,
            isConfirm: false,
            isStatus: false,
            language: AppStorage.language,
            birthDay: AppStorage.birthDay,
            birthMonth: AppStorage.birthMonth,
            birthYear: AppStorage.birthYear,
            isFolderEditMode: false,
            message: null,
            supportTickets: [],
            selectedTicketId: null,
            chatMessages: [],
            chatInputText: "",
            showNewTicketForm: false,
            newTicketSubject: "",
            newTicketMessage: "",
            mobileChatOpen: false,
        };
    });

    const patchState = useCallback((patch: Partial<State>) => {
        setState((prev) => ({ ...prev, ...patch }));
    }, []);

    const syncTabFromUrl = useCallback(() => {
        const match = window.location.pathname.match(/\/profile\/(.+)$/);
        if (match) {
            const tab = match[1];
            const tabMap: Record<string, number> = {
                personal: 0,
                password: 1,
                interface: 2,
                folders: 3,
                support: 4,
            };
            patchState({ profileState: tabMap[tab] ?? 0 });
        } else if (window.location.pathname === "/profile") {
            patchState({ profileState: 0 });
        }
    }, [patchState]);

    const loadProfile = useCallback(async () => {
        const data = await getProfile();
        if (data === null) {
            navigate("/login");
            return;
        }

        let birthDay = "";
        let birthMonth = "";
        let birthYear = "";

        if (data.birthdate && typeof data.birthdate === "string") {
            const parts = data.birthdate.split("T")[0].split("-");
            birthYear = parts[0];
            birthMonth = String(parseInt(parts[1]));
            birthDay = String(parseInt(parts[2]));
        }

        AppStorage.setProfileData({
            is_male: data.is_male ?? true,
            name: data.name || "",
            surname: data.surname || "",
            email: data.email || "",
            image_path: data.image_path || "",
            birthDay,
            birthMonth,
            birthYear,
            anonymousEnabled: data.accept_anonymous,
        });

        patchState({
            name: data.name || "",
            surname: data.surname || "",
            email: data.email || "",
            is_male: data.is_male ?? true,
            avatarUrl: AppStorage.getAvatarUrl(),
            isStatus: false,
            birthDay,
            birthMonth,
            birthYear,
        });
    }, [navigate, patchState]);

    const stopPolling = useCallback(() => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    }, []);

    const fetchTicketMessages = useCallback(
        async (ticketId: number) => {
            const messages = await getMessages(ticketId);
            patchState({ chatMessages: messages });
        },
        [patchState],
    );

    const fetchSupportTickets = useCallback(async () => {
        const tickets = await getMyTickets();
        patchState({ supportTickets: tickets });
    }, [patchState]);

    const startPolling = useCallback(() => {
        fetchSupportTickets();
        pollingIntervalRef.current = setInterval(() => {
            fetchSupportTickets();
            setState((prev) => {
                if (prev.selectedTicketId) {
                    fetchTicketMessages(prev.selectedTicketId);
                }
                return prev;
            });
        }, 10000);
    }, [fetchSupportTickets, fetchTicketMessages]);

    useEffect(() => {
        window.addEventListener("popstate", syncTabFromUrl);

        unsubscribeRef.current = AppStorage.subscribe(() => {
            patchState({ language: AppStorage.language });
        });

        loadProfile();
        syncTabFromUrl();

        return () => {
            window.removeEventListener("popstate", syncTabFromUrl);
            unsubscribeRef.current?.();
            stopPolling();
        };
    }, []);

    const validateField = useCallback(
        (field: string, value: string) => {
            const data: any = {
                email: field === "email" ? value : state.email,
                newPassword: field === "newPassword" ? value : state.newPassword,
                oldPassword: field === "oldPassword" ? value : state.oldPassword,
                name: field === "name" ? value : state.name,
                surname: field === "surname" ? value : state.surname,
            };

            const result = validation(data, t);
            if (!result.isValid) {
                const fieldError = result.errors.find((err: any) => err.field === field);
                if (fieldError) return fieldError.message;
            }
            return undefined;
        },
        [state.email, state.newPassword, state.oldPassword, state.name, state.surname, t],
    );

    const shouldShowSuccess = useCallback(
        (field: string): boolean => {
            const value = (state as any)[field];
            const error = state.errors[field];
            const isTouched = state.touched[field];
            return Boolean(isTouched && value && !error);
        },
        [state],
    );

    const handleInputChange = useCallback(
        (field: string, value: string) => {
            const error = validateField(field, value);
            setState((prev) => ({
                ...prev,
                [field]: value,
                touched: { ...prev.touched, [field]: true },
                errors: { ...prev.errors, [field]: error },
            }));
        },
        [validateField],
    );

    const handleAvatarUpdate = useCallback(() => {
        setState((prev) => ({
            ...prev,
            avatarKey: prev.avatarKey + 1,
            avatarUrl: AppStorage.getAvatarUrl(),
        }));
        NotificationManager.show(true);
    }, []);

    const handleChangePassword = useCallback(
        async (event: React.MouseEvent) => {
            event.preventDefault();
            try {
                const response = await changePassword({
                    old_password: state.oldPassword,
                    new_password: state.newPassword,
                });

                if (response) {
                    patchState({ oldPassword: "", newPassword: "" });
                    NotificationManager.show(true);
                } else {
                    NotificationManager.show(false, "passwords_dont_match");
                }
            } catch {
                NotificationManager.show(false);
            }
        },
        [state.oldPassword, state.newPassword, patchState],
    );

    const handleChangeProfileData = useCallback(
        async (event: React.MouseEvent) => {
            event.preventDefault();

            const { birthDay, birthMonth, birthYear } = state;
            let birthDate: string | null = null;

            if (birthYear?.length && birthMonth?.length && birthDay?.length) {
                const month = birthMonth.padStart(2, "0");
                const day = birthDay.padStart(2, "0");
                birthDate = `${birthYear}-${month}-${day}T00:00:00Z`;
            }

            try {
                const payload: any = {
                    name: state.name,
                    surname: state.surname,
                    is_male: state.is_male,
                    email: state.email,
                };
                if (birthDate) payload.birthdate = birthDate;

                const response = await changeProfile(payload);
                if (response) {
                    const currentImagePath = AppStorage.image_path;
                    AppStorage.setProfileData({
                        name: state.name,
                        surname: state.surname,
                        email: state.email,
                        is_male: state.is_male,
                        image_path: currentImagePath,
                        birthDay,
                        birthMonth,
                        birthYear,
                        anonymousEnabled: AppStorage.anonymousEnabled,
                    });
                    patchState({
                        is_male: state.is_male,
                        name: state.name,
                        surname: state.surname,
                        birthDay,
                        birthMonth,
                        birthYear,
                    });
                    NotificationManager.show(true);
                } else {
                    NotificationManager.show(false);
                }
            } catch (error) {
                console.error("Ошибка изменения профиля:", error);
                patchState({ isConfirm: true, isStatus: false });
            }
        },
        [state, patchState],
    );

    const handleGenderChange = (value: boolean) => patchState({ is_male: value });

    const handleBackToMail = () => {
        patchState({ isModalOpen: false, isConfirm: false });
        navigate("/");
    };

    const handleAvatar = (event: React.MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
        patchState({ isModalOpen: true });
    };

    const handleCloseModal = () => patchState({ isModalOpen: false });

    const handleProfileClick = () => {
        patchState({ isModalOpen: false, isConfirm: false, profileState: 0 });
        navigate("/profile/personal");
    };

    const handleSettingsClick = () => {
        patchState({ isModalOpen: false, isConfirm: false, profileState: 2 });
        navigate("/profile/interface");
    };

    const handleChangeProfile = () => {
        patchState({ profileState: 0 });
        stopPolling();
        navigate("/profile/personal");
    };

    const handleChangePasswordState = () => {
        patchState({ profileState: 1 });
        stopPolling();
        navigate("/profile/password");
    };

    const handleSetting = () => {
        patchState({ profileState: 2 });
        stopPolling();
        navigate("/profile/interface");
    };

    const handleFolder = () => {
        patchState({ profileState: 3 });
        stopPolling();
        navigate("/profile/folders");
    };

    const handleDateChange = (date: { day: string; month: string; year: string }) => {
        patchState({
            birthDay: date.day,
            birthMonth: date.month,
            birthYear: date.year,
        });
    };

    const handleBackToSettings = () => {
        document.querySelector(".sidebar")?.classList.toggle("open");
    };

    const handleEnableNotifs = () => {
        AppStorage.setNotificationsEnabled(true);
        requestNotificationPermission();
        NotificationManager.show(true, "notifications_enabled");
    };

    const handleDisableNotifs = () => {
        AppStorage.setNotificationsEnabled(false);
        NotificationManager.show(true, "notifications_disabled");
    };

    const handleEnableAnons = async () => {
        await changeProfile({
            name: state.name,
            surname: state.surname,
            is_male: state.is_male,
            accept_anonymous: true,
        });
        AppStorage.setAnonymousEnabled(true);
        NotificationManager.show(true, "anonymous_enabled");
    };

    const handleDisableAnons = async () => {
        await changeProfile({
            name: state.name,
            surname: state.surname,
            is_male: state.is_male,
            accept_anonymous: false,
        });
        AppStorage.setAnonymousEnabled(false);
        NotificationManager.show(true, "anonymous_disabled");
    };

    const handleSupport = () => {
        startPolling();
        patchState({ profileState: 4 });
        navigate("/profile/support");
    };

    const handleNewTicket = () => {
        document.querySelector(".support-modal")?.classList.toggle("show");
    };

    const handleSelectTicket = (ticketId: number) => {
        patchState({ selectedTicketId: ticketId, mobileChatOpen: true });
        fetchTicketMessages(ticketId);
    };

    const handleBackToTicketList = () => {
        patchState({ selectedTicketId: null, mobileChatOpen: false });
    };

    const handleChatInputChange = (e: any) => {
        patchState({ chatInputText: e.target.value });
    };

    const handleSendMessage = async () => {
        const { chatInputText, selectedTicketId, chatMessages } = state;
        if (!selectedTicketId) return;

        const resp = await answerTicket(selectedTicketId, chatInputText);
        if (resp) {
            patchState({
                chatInputText: "",
                chatMessages: [...chatMessages, resp],
            });
        }
    };

    const handleCreateTicket = () => {
        const { newTicketSubject, newTicketMessage, supportTickets } = state;
        if (!newTicketSubject.trim() || !newTicketMessage.trim()) return;

        const newTicket = {
            id: Date.now(),
            subject: newTicketSubject,
            status: "open",
            lastMessagePreview: newTicketMessage.slice(0, 50) + (newTicketMessage.length > 50 ? "..." : ""),
        };
        const initialMsg = {
            id: Date.now(),
            text: newTicketMessage,
            timestamp: new Date().toISOString(),
            is_admin: false,
        };

        patchState({
            supportTickets: [...supportTickets, newTicket],
            showNewTicketForm: false,
            newTicketSubject: "",
            newTicketMessage: "",
            selectedTicketId: newTicket.id,
            chatMessages: [initialMsg],
        });
    };

    const getTicketStatus = (ticket: any) => {
        const status = ticket.status;
        if (status === "open") return "открыт";
        if (status === "in_progress") return "в обработке";
        if (status === "closed") return "закрыт";
        return status;
    };

    const {
        errors,
        oldPassword,
        newPassword,
        name,
        surname,
        profileState,
        avatarKey,
        avatarUrl,
        isModalOpen,
        is_male,
        supportTickets,
        selectedTicketId,
        chatMessages,
        chatInputText,
        showNewTicketForm,
        newTicketSubject,
        newTicketMessage,
        mobileChatOpen,
    } = state;

    const isMobile = window.innerWidth < 769;

    return (
        <div className="profile-page" onClick={handleCloseModal}>
            <SupportModal />
            <aside className={`sidebar ${isMobile ? "open" : ""}`}>
                <Sidebar
                    isProfile={1}
                    isPressProfile={profileState}
                    avatarUrl={AppStorage.getAvatarUrl()}
                    name={AppStorage.name}
                    surname={AppStorage.surname}
                    email={AppStorage.email}
                    backToMail={handleBackToMail}
                    changeProfile={handleChangeProfile}
                    changePassword={handleChangePasswordState}
                    handleSetting={handleSetting}
                    handleFolder={handleFolder}
                    handleSupport={handleSupport}
                />
            </aside>

            <div className="right-part">
                {!isMobile && (
                    <div className="top-bar">
                        <div className="search-bar" />
                        <div className="top-right-menu">
                            <Button svg={AppStorage.getAvatarUrl()} name="avatar" help="Аккаунт" onClick={handleAvatar} />
                        </div>
                    </div>
                )}

                <div className="profile-content-area">
                    {profileState === 0 && (
                        <div className="profile-container">
                            {isMobile && (
                                <div className="settings-back-to-menu-button-mobile" onClick={handleBackToSettings}>
                                    <div className="arrow-left-icon" />
                                    <span>{t("profile")}</span>
                                </div>
                            )}
                            <h1>{t("personal_information")}</h1>
                            <div className="profile-content">
                                <div className="profile-avatar">
                                    <UploadAvatar image={avatarUrl} onAvatarUpdate={handleAvatarUpdate} key={avatarKey} />
                                </div>
                                <form className="profile-form">
                                    <Input
                                        type="text"
                                        placeholder={t("enter_name")}
                                        input_title={t("name")}
                                        name="name"
                                        value={name}
                                        success={shouldShowSuccess("name")}
                                        error={errors.name}
                                        onInput={(e: any) => handleInputChange("name", e.target.value)}
                                    />
                                    <Input
                                        type="text"
                                        placeholder={t("enter_surname")}
                                        input_title={t("surname")}
                                        name="surname"
                                        value={surname}
                                        success={shouldShowSuccess("surname")}
                                        error={errors.surname}
                                        onInput={(e: any) => handleInputChange("surname", e.target.value)}
                                    />
                                    <SelectDate
                                        onChange={handleDateChange}
                                        birthDay={state.birthDay}
                                        birthMonth={state.birthMonth}
                                        birthYear={state.birthYear}
                                    />
                                    <div className="profile__checkbox">
                                        <span>{t("gender")}</span>
                                        <div className="checkbox-actions">
                                            <div className="checkbox-form">
                                                <Input
                                                    id="male"
                                                    type="radio"
                                                    name="radio-gender"
                                                    checked={is_male === true}
                                                    onInput={() => handleGenderChange(true)}
                                                />
                                                <label htmlFor="male">{t("male")}</label>
                                            </div>
                                            <div className="checkbox-form">
                                                <Input
                                                    id="female"
                                                    type="radio"
                                                    name="radio-gender"
                                                    checked={is_male !== true}
                                                    onInput={() => handleGenderChange(false)}
                                                />
                                                <label htmlFor="female">{t("female")}</label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="profile-actions">
                                        <Button
                                            title={t("save")}
                                            name="change-profile"
                                            onClick={(event) => {
                                                event.preventDefault();
                                                handleChangeProfileData(event);
                                            }}
                                        />
                                        {!isMobile && (
                                            <Button
                                                title={t("back")}
                                                name="back-to-mail"
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    handleBackToMail();
                                                }}
                                            />
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {profileState === 1 && (
                        <div className="profile-security">
                            {isMobile && (
                                <div className="settings-back-to-menu-button-mobile" onClick={handleBackToSettings}>
                                    <div className="arrow-left-icon" />
                                    <span>{t("profile")}</span>
                                </div>
                            )}
                            <h1>{t("security")}</h1>
                            <div className="profile-content">
                                <form className="profile-form">
                                    <Input
                                        type="password"
                                        placeholder={t("enter_password")}
                                        input_title={t("oldpassword")}
                                        name="oldPassword"
                                        error={errors.oldPassword}
                                        value={oldPassword}
                                        onInput={(e: any) => handleInputChange("oldPassword", e.target.value)}
                                    />
                                    <Input
                                        type="password"
                                        placeholder={t("enter_password")}
                                        input_title={t("newpassword")}
                                        name="newPassword"
                                        error={errors.newPassword}
                                        value={newPassword}
                                        onInput={(e: any) => handleInputChange("newPassword", e.target.value)}
                                    />
                                    <div className="profile-actions">
                                        <Button title={t("save")} name="change-password" onClick={handleChangePassword} />
                                        {!isMobile && (
                                            <Button
                                                title={t("back")}
                                                name="back-to-mail"
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    handleBackToMail();
                                                }}
                                            />
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {profileState === 2 && (
                        <div className="profile-security">
                            {isMobile && (
                                <div className="settings-back-to-menu-button-mobile" onClick={handleBackToSettings}>
                                    <div className="arrow-left-icon" />
                                    <span>{t("profile")}</span>
                                </div>
                            )}
                            <h1>{t("settings")}</h1>
                            <div className="profile-content">
                                <form className="profile-form">
                                    <div className="profile__checkbox">
                                        <span>{t("theme")}</span>
                                        <div className="checkbox-actions">
                                            <div className="checkbox-form">
                                                <Input
                                                    id="dark"
                                                    type="radio"
                                                    name="radio-theme"
                                                    checked={AppStorage.theme === "dark"}
                                                    onChange={() => AppStorage.setTheme("dark")}
                                                />
                                                <label htmlFor="dark">{t("dark_theme")}</label>
                                            </div>
                                            <div className="checkbox-form">
                                                <Input
                                                    id="light"
                                                    type="radio"
                                                    name="radio-theme"
                                                    checked={AppStorage.theme === "light"}
                                                    onChange={() => AppStorage.setTheme("light")}
                                                />
                                                <label htmlFor="light">{t("light_theme")}</label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="profile__checkbox">
                                        <span>{t("interface_language")}</span>
                                        <div className="checkbox-actions">
                                            <div className="checkbox-form">
                                                <Input
                                                    id="ru"
                                                    type="radio"
                                                    name="radio-language"
                                                    checked={AppStorage.language === "ru"}
                                                    onChange={() => AppStorage.setLanguage("ru")}
                                                />
                                                <label htmlFor="ru">{t("russian")}</label>
                                            </div>
                                            <div className="checkbox-form">
                                                <Input
                                                    id="en"
                                                    type="radio"
                                                    name="radio-language"
                                                    checked={AppStorage.language === "en"}
                                                    onChange={() => AppStorage.setLanguage("en")}
                                                />
                                                <label htmlFor="en">{t("english")}</label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="profile__checkbox">
                                        <span>{t("notifications")}</span>
                                        <div className="checkbox-actions">
                                            <div className="checkbox-form">
                                                <Input
                                                    id="notif-on"
                                                    type="radio"
                                                    name="radio-notifications"
                                                    checked={AppStorage.notificationsEnabled === true}
                                                    onChange={handleEnableNotifs}
                                                />
                                                <label htmlFor="notif-on">{t("on")}</label>
                                            </div>
                                            <div className="checkbox-form">
                                                <Input
                                                    id="notif-off"
                                                    type="radio"
                                                    name="radio-notifications"
                                                    checked={AppStorage.notificationsEnabled === false}
                                                    onChange={handleDisableNotifs}
                                                />
                                                <label htmlFor="notif-off">{t("off")}</label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="profile__checkbox">
                                        <span>{t("enable_anonymous")}</span>
                                        <div className="checkbox-actions">
                                            <div className="checkbox-form">
                                                <Input
                                                    id="anon-on"
                                                    type="radio"
                                                    name="radio-anonymous"
                                                    checked={AppStorage.anonymousEnabled === true}
                                                    onChange={handleEnableAnons}
                                                />
                                                <label htmlFor="anon-on">{t("allow")}</label>
                                            </div>
                                            <div className="checkbox-form">
                                                <Input
                                                    id="anon-off"
                                                    type="radio"
                                                    name="radio-anonymous"
                                                    checked={AppStorage.anonymousEnabled === false}
                                                    onChange={handleDisableAnons}
                                                />
                                                <label htmlFor="anon-off">{t("not_allow")}</label>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {profileState === 3 && (
                        <div className="profile-folder">
                            {isMobile && (
                                <div className="settings-back-to-menu-button-mobile" onClick={handleBackToSettings}>
                                    <div className="arrow-left-icon" />
                                    <span>{t("profile")}</span>
                                </div>
                            )}
                            <h1>{t("folder")}</h1>
                            <div className="profile-content">
                                <form className="profile-form">
                                    <FolderChange isEditMode={state.isFolderEditMode} showConfirmationModal={NotificationManager.show} />
                                </form>
                            </div>
                        </div>
                    )}

                    {profileState === 4 && (
                        <div className="profile-support">
                            {isMobile && (
                                <div className="settings-back-to-menu-button-mobile" onClick={handleBackToSettings}>
                                    <div className="arrow-left-icon" />
                                    <span>{t("profile")}</span>
                                </div>
                            )}

                            <div className={`support-wrapper ${isMobile ? "mobile" : ""} ${mobileChatOpen ? "chat-open" : ""}`}>
                                <div className="support-container">
                                    <div className="support-tickets-panel">
                                        <div className="support-tickets-header">
                                            <h2>Поддержка</h2>
                                            <Button
                                                svg="../../assets/svg/Compose.svg"
                                                className="small-text"
                                                name="new-ticket"
                                                onClick={handleNewTicket}
                                            />
                                        </div>
                                        {showNewTicketForm && (
                                            <div className="new-ticket-form">
                                                <Input
                                                    type="text"
                                                    placeholder="Subject"
                                                    value={newTicketSubject}
                                                    onInput={(e: any) => patchState({ newTicketSubject: e.target.value })}
                                                />
                                                <textarea
                                                    placeholder="Describe your issue..."
                                                    value={newTicketMessage}
                                                    onChange={(e) => patchState({ newTicketMessage: e.target.value })}
                                                    rows={4}
                                                />
                                                <div className="form-actions">
                                                    <Button title="Create" name="create-ticket" onClick={handleCreateTicket} />
                                                    <Button
                                                        title="Cancel"
                                                        name="cancel-ticket"
                                                        onClick={() =>
                                                            patchState({
                                                                showNewTicketForm: false,
                                                                newTicketSubject: "",
                                                                newTicketMessage: "",
                                                            })
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <ul className="tickets-list">
                                            {supportTickets.map((ticket: any) => {
                                                const ticketId = ticket.ticket_id ?? ticket.id;
                                                return (
                                                    <li
                                                        key={ticketId}
                                                        className={`ticket-item ${selectedTicketId === ticketId ? "active" : ""}`}
                                                        onClick={() => handleSelectTicket(ticketId)}>
                                                        <div className="ticket-subject">{ticket.header ?? ticket.subject}</div>
                                                        <div className="ticket-status" data-status={getTicketStatus(ticket)}>
                                                            {getTicketStatus(ticket)}
                                                        </div>
                                                        <div className="ticket-preview">{ticket.lastMessagePreview}</div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>

                                    <div className="support-chat-panel">
                                        {isMobile && selectedTicketId && (
                                            <div className="chat-mobile-back" onClick={handleBackToTicketList}>
                                                <div className="arrow-left-icon" />
                                                <span>Back to tickets</span>
                                            </div>
                                        )}

                                        {!selectedTicketId ? (
                                            <div className="chat-empty">Выберите тикет для просмотра</div>
                                        ) : (
                                            <>
                                                <div className="chat-messages">
                                                    {chatMessages.map((msg: any) => (
                                                        <div key={msg.id} className={`message ${msg.is_admin ? "admin" : "user"}`}>
                                                            <div className="message-bubble">
                                                                <div className="message-text">{msg.text}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="chat-input-area">
                                                    <Textarea
                                                        type="text"
                                                        className="chat-input"
                                                        placeholder="Введите сообщение..."
                                                        value={chatInputText}
                                                        onInput={handleChatInputChange}
                                                    />
                                                    <Button title="Send" name="send-message" onClick={handleSendMessage} />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <ProfileModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onProfileClick={handleProfileClick}
                    onSettingsClick={handleSettingsClick}
                />
            </div>
        </div>
    );
}
