import BaseEmailPage from "../../widgets/BaseEmailPage/BaseEmailPage";
import { getEmailsFromFolder, deleteEmailsFromFolder } from "../../api/ApiFolder";
import { AppStorage } from "../../App";
import { useParams } from "react-router-dom";
import { useEffect, useMemo } from "react";

export default function FolderPage() {
    const { folderId: folderIdParam } = useParams<{ folderId: string }>();

    const folderId = useMemo(() => {
        const parsed = folderIdParam ? parseInt(folderIdParam, 10) : NaN;
        if (!Number.isNaN(parsed)) return parsed;
        return AppStorage.getCurrentFolderId?.() ?? 0;
    }, [folderIdParam]);

    const folderName = useMemo(() => AppStorage.folders?.find((f: any) => f.id === folderId)?.name || "Папка", [folderId]);

    useEffect(() => {
        AppStorage.setCurrentFolderId(folderId);
    }, [folderId]);

    return (
        <BaseEmailPage
            currentView="folder"
            fetchEmails={(offset: number) => getEmailsFromFolder(offset, folderId)}
            deleteEmails={(ids: number[]) => deleteEmailsFromFolder(folderId, ids)}
            emptyMessage={`Папка "${folderName}" пуста`}
            emptySubMessage="Переместите письма в эту папку"
            showUnreadToggle={false}
            showMarkAsRead={false}
            showMoveToFolder={false}
            currentFolderId={folderId}
            currentFolderName={folderName}
        />
    );
}
