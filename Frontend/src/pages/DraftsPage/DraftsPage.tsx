import BaseEmailPage from "../../widgets/BaseEmailPage/BaseEmailPage";
import { getDrafts, deleteDraft } from "../../api/ApiDraft";

export default function DraftsPage() {
  return (
    <BaseEmailPage
      currentView="drafts"
      fetchEmails={getDrafts}
      deleteEmails={deleteDraft}
      emptyMessage="Нет черновиков"
      showUnreadToggle={false}
      showMarkAsRead={false}
      showMoveToFolder={false}
      currentFolderId={null}
    />
  );
}