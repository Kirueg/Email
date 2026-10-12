import React, { useState } from "react";
import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";
import { validation } from "../../utils/validation";
import { postDataLogin, getProfile } from "../../api/ApiAuth";
import "./LoginPage.scss";
import { AppStorage } from "../../App";
import { useNavigate } from "react-router-dom";

type Errors = Record<string, string | undefined>;

export default function LoginPage() {
    const navigate = useNavigate();

    const suffix = "@e-smail.ru";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<Errors>({});
    const [, setIsLoading] = useState(false);

    const t = (key: string) => AppStorage.t(key);

    const validateField = (field: string, value: string) => {
        const data: any = {
            email: field === "email" ? value + suffix : email + suffix,
            password: field === "password" ? value : password,
        };

        const result = validation(data, t);

        if (!result.isValid) {
            const fieldError = result.errors.find((err: any) => err.field === field);
            if (fieldError) {
                return fieldError.message;
            }
        }
        return undefined;
    };

    const handleInputChange = (field: string, value: string) => {
        const error = validateField(field, value);
        if (field === "email") {
            setEmail(value);
        }
        if (field === "password") {
            setPassword(value);
        }

        setErrors((prev) => ({ ...prev, [field]: error }));
    };

    const validateAllFields = () => {
        const data = {
            email: email + suffix,
            password: password,
        };

        const result = validation(data, t);
        const newErrors: any = {};

        if (!result.isValid) {
            result.errors.forEach((err: any) => {
                if (err.field && !newErrors[err.field]) {
                    newErrors[err.field] = err.message;
                }
            });
        }

        setErrors(newErrors);
        return result.isValid;
    };

    const handleSubmit = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        const isValid = validateAllFields();

        if (!isValid) {
            return;
        }

        setIsLoading(true);
        const response = await postDataLogin({
            email: email + suffix,
            password: password,
        });

        if (response && response.isValid) {
            const data = await getProfile();
            AppStorage.setProfileData(data);
            navigate("/");
        } else if (response && !response.isValid) {
            const serverErrors: any = {};
            response.errors?.forEach((err: any) => {
                if (err.field && !serverErrors[err.field]) {
                    serverErrors[err.field] = err.message;
                }
            });
            setErrors(serverErrors);
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-page__form-container">
                    <div className="logo-container">
                        <img src="../../assets/svg/Logo.svg" />
                        <h1 className="logo__title">SMail</h1>
                    </div>
                    <h1 className="auth-form__subtitle">{t("auth_subtitle")}</h1>
                    <h1 className="auth-form__title">{t("auth_title")}</h1>
                    <form action="" className="auth-form">
                        <div className="auth-form__inputs">
                            <Input
                                type="email"
                                placeholder={t("enter_email")}
                                input_title={t("email")}
                                name="email"
                                suffix="@e-smail.ru"
                                error={errors.email}
                                value={email}
                                onInput={(e: any) => {
                                    const raw = e.target.value;
                                    const atIndex = raw.indexOf("@");
                                    const clean = atIndex !== -1 ? raw.substring(0, atIndex) : raw;
                                    handleInputChange("email", clean);
                                }}
                            />
                            <Input
                                type="password"
                                placeholder={t("enter_password")}
                                input_title={t("password")}
                                name="password"
                                error={errors.password}
                                value={password}
                                onInput={(e: any) => {
                                    handleInputChange("password", e.target.value);
                                }}
                            />
                        </div>
                        <div className="auth-form__actions">
                            <Button
                                title={t("enter")}
                                name="button-login-for-login"
                                onClick={async (event: React.MouseEvent<HTMLButtonElement>) => {
                                    event.preventDefault();
                                    await handleSubmit(event);
                                }}
                            />
                            <Button
                                title={t("register")}
                                name="button-reg-for-login"
                                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                                    event.preventDefault();
                                    navigate("/register");
                                }}
                            />
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
