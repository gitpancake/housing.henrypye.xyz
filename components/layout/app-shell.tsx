"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarGroup,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarProvider,
    SidebarSeparator,
    SidebarTrigger,
    SidebarInset,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ThemeTogglerButton } from "@/components/animate-ui/components/buttons/theme-toggler";
import { AuthProvider, useAuth, type AuthUser } from "@/contexts/AuthContext";
import ProfileDialog from "@/components/profile-dialog";

interface AppShellProps {
    children: React.ReactNode;
    user: {
        displayName: string;
        username: string;
        isAdmin: boolean;
        email: string;
        photoURL: string | null;
        sharedUserId: string;
        activeTeamId: string;
        teamRole: "owner" | "collaborator" | "viewer";
    };
}

const NAV_GROUPS = [
    [
        { href: "/", label: "Dashboard" },
        { href: "/listings", label: "Listings" },
        { href: "/map", label: "Map" },
    ],
    [
        { href: "/calendar", label: "Calendar" },
        { href: "/compare", label: "Compare" },
        { href: "/todos", label: "Tasks" },
    ],
    [
        { href: "/budget", label: "Budget" },
        { href: "/profile", label: "Profile" },
    ],
];

function getInitials(name: string | null, email: string): string {
    if (name) {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    }
    return email[0]?.toUpperCase() ?? "?";
}

function AppShellInner({
    children,
    isAdmin,
}: {
    children: React.ReactNode;
    isAdmin: boolean;
}) {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [profileOpen, setProfileOpen] = useState(false);
    const [profileTab, setProfileTab] = useState<"profile" | "team">("profile");

    function isActive(href: string) {
        return href === "/" ? pathname === "/" : pathname.startsWith(href);
    }

    return (
        <SidebarProvider
            style={{ "--sidebar-width": "13rem" } as React.CSSProperties}
        >
            <Sidebar>
                <SidebarHeader className="px-5 py-5">
                    <h1 className="font-mono text-sm font-bold text-sidebar-primary tracking-tight">
                        nest finder.
                    </h1>
                </SidebarHeader>

                <SidebarContent>
                    {NAV_GROUPS.map((group, i) => (
                        <Fragment key={i}>
                            {i > 0 && <SidebarSeparator />}
                            <SidebarGroup className="py-0">
                                <SidebarMenu>
                                    {group.map((item) => (
                                        <SidebarMenuItem key={item.href}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={isActive(item.href)}
                                            >
                                                <Link href={item.href}>
                                                    {item.label}
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroup>
                        </Fragment>
                    ))}
                    {isAdmin && (
                        <>
                            <SidebarSeparator />
                            <SidebarGroup className="py-0">
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive("/admin")}
                                        >
                                            <Link href="/admin">Admin</Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroup>
                        </>
                    )}
                </SidebarContent>

                <SidebarFooter>
                    <Separator className="bg-sidebar-border" />
                    <div className="px-2 py-1">
                        <button
                            onClick={() => { setProfileTab("profile"); setProfileOpen(true); }}
                            className="flex items-center gap-2 w-full text-left hover:opacity-80 transition-opacity"
                        >
                            <Avatar className="size-6">
                                {user.photoURL && (
                                    <AvatarImage
                                        src={user.photoURL}
                                        alt={user.displayName ?? ""}
                                    />
                                )}
                                <AvatarFallback className="text-[10px] bg-sidebar-accent text-sidebar-accent-foreground">
                                    {getInitials(user.displayName, user.email)}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-sidebar-foreground/70 truncate">
                                {user.displayName ?? user.email}
                            </span>
                        </button>
                        <button
                            onClick={() => { setProfileTab("team"); setProfileOpen(true); }}
                            className="text-[10px] text-sidebar-foreground/50 hover:text-sidebar-foreground/80 transition-colors truncate text-left pl-8 -mt-0.5 mb-1"
                        >
                            {user.teamRole === "owner" ? "Manage team" : "View team"}
                        </button>
                        <div className="flex items-center justify-between">
                            <button
                                onClick={logout}
                                className="text-xs text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors"
                            >
                                Sign out
                            </button>
                        </div>
                    </div>
                </SidebarFooter>
            </Sidebar>

            <SidebarInset>
                <header className="flex items-center justify-between border-b px-4 py-3 lg:px-8">
                    <div className="flex items-center gap-3">
                        <SidebarTrigger className="-ml-1" />
                    </div>
                    <div className="flex items-center gap-1">
                        <ThemeTogglerButton
                            variant="ghost"
                            size="sm"
                            modes={["dark", "light"]}
                        />
                    </div>
                </header>
                <main className="p-4 lg:p-8">{children}</main>
            </SidebarInset>
            <ProfileDialog
                open={profileOpen}
                onOpenChange={setProfileOpen}
                defaultTab={profileTab}
            />
        </SidebarProvider>
    );
}

export function AppShell({ children, user }: AppShellProps) {
    const authUser: AuthUser = {
        uid: user.username,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        sharedUserId: user.sharedUserId,
        activeTeamId: user.activeTeamId,
        teamRole: user.teamRole,
    };

    return (
        <AuthProvider user={authUser}>
            <AppShellInner isAdmin={user.isAdmin}>
                {children}
            </AppShellInner>
        </AuthProvider>
    );
}
