import { Construction } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ComingSoonProps {
  title: string;
  description: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <Card className="max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <Construction className="size-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle>Coming in a future phase</CardTitle>
              <CardDescription>
                This section is part of the application shell for Phase 1.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Functionality for this area will be added in subsequent development
            phases. Navigate to Dashboard or Submissions to explore the current
            prototype.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
