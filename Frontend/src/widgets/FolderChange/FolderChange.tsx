import "./FolderChange.scss";
import Button from "../../components/Button/Button";
import { AppStorage } from "../../App";
import { getProfile } from "../../api/ApiAuth";
import { createNewFolder, changeFolderName, deleteFolder } from "../../api/ApiFolder";
import ConfirmationDialog from "../../widgets/ConfirmationDialog/ConfirmationDialog";
import { useCallback, useRef, useState, useEffect } from "react";

interface Folder {
    id: number;
    name: string;
}

interface FolderChangeProps {
    isEditMode?: boolean;
    showConfirmationModal?: (_success: boolean, _message?: string) => void;
}

interface State {
    folders: Folder[];
    editingFolderId: number | null;
    editingFolderName: string;
    showDeleteConfirm: boolean;
    folderToDeleteId: number | null;
    folderToDeleteName: string;
    error: string | null;
}

export default function FolderChange(props: FolderChangeProps) {
    const { isEditMode = false } = props;

    const lastClickTime = useRef(0);

    const [state, setState] = useState<State>(() => ({
        folders: Array.isArray(AppStorage.folders) ? AppStorage.folders : [],
        editingFolderId: null,
        editingFolderName: "",
        showDeleteConfirm: false,
        folderToDeleteId: null,
        folderToDeleteName: "",
        error: null,
    }));

    const patchState = useCallback((patch: Partial<State>) => {
        setState((prev) => ({ ...prev, ...patch }));
    }, []);

    const loadFolders = async () => {
        const data = await getProfile();
        if (data && data.folder && Array.isArray(data.folder)) {
            const folders = data.folder.map((folder: any) => ({
                id: folder.folder_id,
                name: folder.folder_name,
            }));
            patchState({ folders });
            AppStorage.setFolders(folders);
        }
    };

    useEffect(() => {
        AppStorage.folderChangeInstance = {
            saveAllPendingChanges: async () => {
                if (state.editingFolderId != null) {
                    await commitFolderEdit(state.editingFolderId);
                }
            },
        };

        loadFolders();

        return () => {
            AppStorage.folderChangeInstance = null;
        };
    }, []);

    const cancelEditing = useCallback(() => {
        patchState({ editingFolderId: null, editingFolderName: "" });
    }, [patchState]);

    const commitFolderEdit = async (folderId: number) => {
        const { editingFolderName, folders } = state;
        const trimmed = editingFolderName.trim();
        const original = folders.find((f: any) => f.id === folderId)?.name || "";

        if (!trimmed || trimmed === original) {
            cancelEditing();
            return;
        }

        if (folders.some((f: any) => f.id !== folderId && f.name === trimmed)) {
            patchState({ error: "Папка с таким именем уже существует" });
            return;
        }

        try {
            await changeFolderName(folderId, trimmed);
            const updatedFolders = folders.map((folder: any) => (folder.id === folderId ? { ...folder, name: trimmed } : folder));
            patchState({
                folders: updatedFolders,
                editingFolderId: null,
                editingFolderName: "",
                error: null,
            });
            AppStorage.setFolders(updatedFolders);
        } catch (error) {
            console.error("Error saving folder name:", error);
            cancelEditing();
        }
    };

    const handleFolderKeyDown = (e: any, folderId: number) => {
        if (e.key === "Enter") {
            e.preventDefault();
            commitFolderEdit(folderId);
        } else if (e.key === "Escape") {
            cancelEditing();
        }
    };

    const handleNameClick = (e: React.MouseEvent, folderId: number, name: string) => {
        e.preventDefault();
        const now = Date.now();
        if (now - lastClickTime.current < 300) {
            startEditing(folderId, name);
        }
        lastClickTime.current = now;
    };

    const startEditing = useCallback(
        (folderId: number, currentName: string) => {
            if (state.editingFolderId !== null) {
                commitFolderEdit(state.editingFolderId);
            }
            patchState({
                editingFolderId: folderId,
                editingFolderName: currentName,
            });
        },
        [state.editingFolderId, commitFolderEdit, patchState],
    );

    const handleAddFolder = async () => {
        if (folders.length >= 6) {
            props.showConfirmationModal?.(false, "too_many_folders");
            return;
        }

        let newFolderName = t("new_folder");
        if (folders.some((f: any) => f.name === newFolderName)) {
            let i = 2;
            while (folders.some((f: any) => f.name === `${newFolderName} ${i}`)) {
                i++;
            }
            newFolderName = `${newFolderName} ${i}`;
        }

        const response = await createNewFolder(newFolderName);
        if (response?.folder_id) {
            const updatedFolders = [...folders, { id: response.folder_id, name: newFolderName }];
            patchState({ folders: updatedFolders });
            AppStorage.setFolders(updatedFolders);
        } else {
            await loadFolders();
        }
    };

    const handleDeleteFolder = (folderId: number, folderName: string, event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        patchState({
            showDeleteConfirm: true,
            folderToDeleteId: folderId,
            folderToDeleteName: folderName,
        });
    };

    const confirmDelete = async () => {
        const { folderToDeleteId, folders } = state;
        if (!folderToDeleteId) return;

        const updatedFolders = folders.filter((f: any) => f.id !== folderToDeleteId);
        await deleteFolder(folderToDeleteId);
        patchState({
            folders: updatedFolders,
            editingFolderId: null,
            editingFolderName: "",
            showDeleteConfirm: false,
            folderToDeleteId: null,
        });
        AppStorage.setFolders(updatedFolders);
    };

    const cancelDelete = () => {
        patchState({ showDeleteConfirm: false, folderToDeleteId: null });
    };

    const t = (key: string) => AppStorage.t(key);

    const { folders, editingFolderId, editingFolderName } = state;

    return (
        <div className="folder-container">
            <div className="folder-list">
                {folders.map((folder: any) => (
                    <div key={folder.id} className="folder-item">
                        <button className="folder-delete-btn" onClick={(e: any) => handleDeleteFolder(folder.id, folder.name, e)}>
                            ✕
                        </button>

                        {editingFolderId === folder.id ? (
                            <div className="folder-edit">
                                <input
                                    className="folder-edit__input"
                                    value={editingFolderName}
                                    onInput={(e: React.FormEvent<HTMLInputElement>) =>
                                        patchState({
                                            editingFolderName: (e.target as HTMLInputElement).value,
                                        })
                                    }
                                    onBlur={() => commitFolderEdit(folder.id)}
                                    onKeyDown={(e: any) => handleFolderKeyDown(e, folder.id)}
                                    autoFocus
                                />
                            </div>
                        ) : (
                            <span className="folder-name" onClick={(e: any) => handleNameClick(e, folder.id, folder.name)}>
                                {folder.name}
                            </span>
                        )}

                        {isEditMode && editingFolderId !== folder.id && (
                            <button className="folder-drag-btn" onClick={(e: any) => e.preventDefault()} />
                        )}
                    </div>
                ))}
            </div>
            <div className="folder-actions">
                <Button
                    title={t("add_a_folder")}
                    name="add_a_folder"
                    onClick={(e: any) => {
                        e.preventDefault();
                        handleAddFolder();
                    }}
                />
            </div>
            {state.showDeleteConfirm && (
                <ConfirmationDialog
                    text={`${t("confirm_delete_folder")} "${state.folderToDeleteName}"?`}
                    callbackConfirm={confirmDelete}
                    callbackCancel={cancelDelete}
                />
            )}
        </div>
    );
}
