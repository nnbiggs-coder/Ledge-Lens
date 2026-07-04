"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  FilePlus2,
  Scale,
  BarChart3,
  ScrollText,
  Settings,
  Layers,
  MessageCircle,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useChat } from "@/components/chat/chat-provider";

const navGroups = [
  {
    label: "Workbench",
    items: [
      { title: "Dashboard", href: "/", icon: LayoutDashboard },
      { title: "Submissions", href: "/submissions", icon: Inbox },
      { title: "New Submission", href: "/submissions/new", icon: FilePlus2 },
    ],
  },
  {
    label: "Governance",
    items: [
      { title: "Underwriting Rules", href: "/underwriting-rules", icon: Scale },
      { title: "Analytics", href: "/analytics", icon: BarChart3 },
      { title: "Audit Log", href: "/audit-log", icon: ScrollText },
      { title: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { setOpen } = useChat();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    if (href === "/submissions") return pathname === "/submissions";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="hover:bg-sidebar-accent/80"
              render={<Link href="/" />}
            >
              <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
                <Layers className="size-4" />
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-semibold tracking-tight">
                  LedgeLens
                </span>
                <span className="truncate text-xs text-sidebar-foreground/70">
                  Underwriting Workbench
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-2">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase tracking-wider">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive(item.href)}
                      tooltip={item.title}
                      className="rounded-lg data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground"
                      render={<Link href={item.href} />}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Open Assistant"
              className="rounded-lg bg-sidebar-primary/90 text-sidebar-primary-foreground hover:bg-sidebar-primary"
              onClick={() => setOpen(true)}
            >
              <MessageCircle />
              <span>Ask Assistant</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="mt-2 rounded-lg bg-sidebar-accent/50 px-3 py-2">
          <p className="text-xs font-medium text-sidebar-foreground/90">
            Phase 1 Prototype
          </p>
          <p className="mt-0.5 text-[10px] leading-relaxed text-sidebar-foreground/60">
            Fictional data · FC dashboard view
          </p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
