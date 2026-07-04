"use client";

import { PageHeader } from "@/components/layout/page-header";
import { useDemo } from "@/context/demo-provider";
import { AiDisclaimer } from "@/components/layout/disclaimers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw } from "lucide-react";

export function SettingsContent() {
  const { state, dispatch } = useDemo();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Demo mode configuration and workbench preferences."
      />

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Demo Mode</CardTitle>
          <CardDescription>
            This prototype runs entirely on synthetic seeded data with no external
            database or AI API required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">Demo mode active</Badge>
            <Badge variant="outline">{state.submissions.length} submissions loaded</Badge>
            <Badge variant="outline">{state.auditLog.length} audit events</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Corrections, overrides, and premium selections are stored in browser
            memory and reset when you reload the page unless you reset manually below.
          </p>
          <Button
            variant="destructive"
            onClick={() => {
              if (
                window.confirm(
                  "Reset all demo data to original seed state? This cannot be undone."
                )
              ) {
                dispatch({ type: "RESET_DEMO" });
              }
            }}
          >
            <RotateCcw />
            Reset demo data
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Disclaimers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <AiDisclaimer />
          <p className="text-xs text-muted-foreground">
            Independent concept prototype using fictional data. Not affiliated with
            Ledgebrook or any insurer, MGA, broker, or actuarial organization.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
