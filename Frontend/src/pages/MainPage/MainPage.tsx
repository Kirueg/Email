import BaseEmailPage from "../../widgets/BaseEmailPage/BaseEmailPage";
import { getInbox } from "../../api/ApiEmail";

export default function MainPage() {
    return (
        <BaseEmailPage
            currentView="inbox"
            fetchEmails={getInbox}
            emptyMessage="Ваш почтовый ящик пуст :("
            emptySubMessage="Напишите ваше первое письмо, нажав на кнопку слева"
            showUnreadToggle
            showMarkAsRead
            showMoveToFolder
            currentFolderId={null}
        />
    );
}
