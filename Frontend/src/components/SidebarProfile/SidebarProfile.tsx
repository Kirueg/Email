import { AppStorage } from "../../App";
import "./SidebarProfile.scss";
import Button from "../Button/Button";
import { logOut } from "../../api/ApiAuth";
import { useNavigate } from "react-router-dom";

interface PropsSidebarProfile {
    name?: string;
    surname?: string;
    email?: string;
    avatarUrl?: string;

    variant?: string;
    textAlign?: string;
}

export default function SidebarProfile(props: PropsSidebarProfile) {
    const navigate = useNavigate();

    const name = AppStorage.name;
    const surname = AppStorage.surname;
    const email = AppStorage.email;
    const avatarUrl = AppStorage.image_path;

    const { variant = "", textAlign = "" } = props;

    const handleAvatar = () => {
        navigate("/profile");
    };

    const handleExit = async () => {
        await logOut();

        AppStorage.setUnReadCount(0);

        navigate("/login");
    };

    return (
        <div className={`sidebar-profile ${variant}`}>
            {variant === "mobile" ? (
                <Button
                    className="sidebar-profile__profile-btn"
                    svg={AppStorage.getAvatarUrl()}
                    name="avatar"
                    help="Аккаунт"
                    onClick={handleAvatar}
                />
            ) : (
                <img src={avatarUrl || "../../assets/svg/Avatar.svg"}></img>
            )}
            <div className={`sidebar-profile__text ${textAlign}`} onClick={variant === "mobile" ? handleAvatar : () => {}}>
                <span className="sidebar-profile__name">
                    {name} {surname}
                </span>
                <p className="sidebar-profile__email">{email}</p>
            </div>
            {variant === "mobile" ? <div className="sidebar-profile__logout-btn" onClick={handleExit} /> : null}
        </div>
    );
}
