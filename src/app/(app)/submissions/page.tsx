import { PageHeader } from "@/components/layout/page-header";
import { SubmissionInbox } from "@/components/submissions/submission-inbox";
import { submissions } from "@/data/seed";

export default function SubmissionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Submissions"
        description="Searchable inbox of all commercial underwriting submissions"
      />
      <SubmissionInbox submissions={submissions} />
    </div>
  );
}
