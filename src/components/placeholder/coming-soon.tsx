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
    <div className="space-y-6 sm:space-y-8">
      <PageHeader title={title} description={description} />
      <Card className="glass-card max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <Construction className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle>Coming in a future phase</CardTitle>
              <CardDescription>
                This module is scaffolded for the Phase 1 application shell.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Full functionality will be delivered in a subsequent release. Use
            the Dashboard or Submission Inbox to explore the current financial
            controller prototype.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
