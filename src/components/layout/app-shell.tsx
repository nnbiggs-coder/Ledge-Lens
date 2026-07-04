"use client";

import { DisclaimerBanner } from "@/components/layout/disclaimer-banner";
import { AppFooter } from "@/components/layout/disclaimers";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { ChatProvider } from "@/components/chat/chat-provider";
import { DemoProvider } from "@/context/demo-provider";
import dynamic from "next/dynamic";

const ChatWidget = dynamic(
  () =>
    import("@/components/chat/chat-widget").then((mod) => mod.ChatWidget),
  { ssr: false }
);
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <DemoProvider>
    <ChatProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-background">
        <DisclaimerBanner />
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 hidden h-4 sm:block" />
          <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                Commercial Underwriting Intelligence
              </p>
              <p className="hidden truncate text-xs text-muted-foreground sm:block">
                Portfolio monitoring & submission triage
              </p>
            </div>
            <Badge
              variant="outline"
              className="hidden shrink-0 border-primary/20 bg-primary/5 text-primary sm:inline-flex"
            >
              FY 2026 · Q3
            </Badge>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <div className="page-container flex min-h-full flex-col">{children}</div>
        </main>
        <AppFooter />
        <ChatWidget />
      </SidebarInset>
    </SidebarProvider>
    </ChatProvider>
    </DemoProvider>
  );
}
