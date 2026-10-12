import "./UploadAvatar.scss";
import { AppStorage } from "../../App";
import { uploadAvatar } from "../../api/ApiAuth";
import { useState } from "react";

interface UploadAvatarProps {
    onAvatarUpdate: () => void;
    image: string;
}

export default function UploadAvatar(props: UploadAvatarProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [localPreview, setLocalPreview] = useState<string | null>(null);

    const handleImageChange = async (e: any) => {
        setIsLoading(true);
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event: any) => {
            setLocalPreview(event.target.result);
        };
        reader.readAsDataURL(file);

        const imagePath = await uploadAvatar(file);
        if (imagePath) {
            AppStorage.setImagePath(imagePath);
            setLocalPreview(null);
            if (props.onAvatarUpdate) {
                props.onAvatarUpdate();
            }
        }

        setIsLoading(false);
    };

    const t = (key: string) => AppStorage.t(key);

    const src = localPreview || props.image || AppStorage.getAvatarUrl() || "../../assets/svg/Avatar.svg";

    return (
        <div className="upload">
            <div className="upload__preview">
                <img id="upload-image" src={src} alt="avatar" />
                {isLoading && (
                    <div className="upload__overlay">
                        <div className="upload__spinner"></div>
                    </div>
                )}
            </div>
            <input id="file-input" type="file" name="file" accept="image/*" hidden onChange={handleImageChange} />
            <label htmlFor="file-input">{t("change_avatar")}</label>
        </div>
    );
}
