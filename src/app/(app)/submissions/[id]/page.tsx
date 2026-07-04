import { SubmissionWorkspace } from "@/components/workspace/submission-workspace";

interface SubmissionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SubmissionDetailPage({
  params,
}: SubmissionDetailPageProps) {
  const { id } = await params;
  return <SubmissionWorkspace id={id} />;
}
