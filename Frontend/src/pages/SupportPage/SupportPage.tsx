import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";
import Select from "../../components/Select/Select";
import Textarea from "../../components/Textarea/Textarea";

import { sendSupportTicket } from "../../api/ApiSupport";

import "./SupportPage.scss";
import { useState } from "react";

interface Category {
    value: string;
    label: string;
}

export default function SupportPage() {
    const [category, setCategory] = useState<Category>({ value: "", label: "" });
    const [problem, setProblem] = useState("");
    const [description, setDescription] = useState("");

    const handleCategoryChange = (value: any, label: any) => {
        setCategory({ value, label });
    };

    const handleProblemChange = (e: React.FormEvent<HTMLInputElement>) => {
        setProblem((e.target as HTMLInputElement).value);
    };

    const handleDescriptionChange = (e: React.FormEvent<HTMLTextAreaElement>) => {
        setDescription((e.target as HTMLTextAreaElement).value);
    };

    const handleSubmit = async () => {
        const payload = {
            theme: category.value,
            header: problem,
            quesion_text: description,
            timestamp: new Date().toISOString(),
        };

        try {
            await sendSupportTicket(payload);
            setCategory({ value: "", label: "" });
            setProblem("");
            setDescription("");
            const url = window.location.origin;
            window.parent.postMessage({ action: "closeSupportModal" }, url);
        } catch (error) {
            console.error("Failed to submit ticket:", error);
        }
    };

    const ticketCategories = [
        { value: "bug", label: "Ошибка" },
        { value: "proposal", label: "Предложение" },
        { value: "complaint", label: "Жалоба" },
        { value: "other", label: "Другое" },
    ];
    return (
        <div className="support-page-container">
            <h1 className="support-page__title">Расскажите о проблеме</h1>
            <span className="support-page__subtitle">С чем связано ваше обращение?</span>
            <Select
                id="category"
                name="category"
                options={ticketCategories}
                placeholder="Выберите категорию"
                onChange={handleCategoryChange}
            />
            <Input input_title="Что за проблема?" placeholder="Краткое описание проблемы" onInput={handleProblemChange} />
            <Textarea
                className="support-textarea"
                input_title="Подробное описание проблемы"
                placeholder="Опишите проблему максимально подробно"
                onInput={handleDescriptionChange}
            />
            <Button title="Отправить" onClick={handleSubmit} />
        </div>
    );
}
