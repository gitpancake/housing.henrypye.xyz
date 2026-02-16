"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
    Home,
    List,
    MapIcon,
    CalendarDays,
    DollarSign,
    CheckSquare,
    User,
    Shield,
    LogOut,
    Menu,
    Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AppShellProps {
    children: React.ReactNode;
    user: {
        displayName: string;
        username: string;
        isAdmin: boolean;
    };
}

const NAV_ITEMS = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/listings", label: "Listings", icon: List },
    { href: "/map", label: "Map", icon: MapIcon },
    { href: "/calendar", label: "Calendar", icon: CalendarDays },
    { href: "/todos", label: "Tasks", icon: CheckSquare },
    { href: "/budget", label: "Budget", icon: DollarSign },
    { href: "/profile", label: "Profile", icon: User },
];

function NavLink({
    href,
    label,
    icon: Icon,
    active,
    onClick,
}: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    active: boolean;
    onClick?: () => void;
}) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
        >
            <Icon className="h-4 w-4" />
            {label}
        </Link>
    );
}

export function AppShell({ children, user }: AppShellProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [mobileOpen, setMobileOpen] = useState(false);

    async function handleLogout() {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
    }

    const sidebar = (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b">
                <Link href="/" className="text-lg font-bold">
                    Nest Finder
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Vancouver Apartment Search
                </p>
            </div>

            <nav className="flex-1 p-3 space-y-1">
                {NAV_ITEMS.map((item) => (
                    <NavLink
                        key={item.href}
                        {...item}
                        active={pathname === item.href}
                        onClick={() => setMobileOpen(false)}
                    />
                ))}
                {user.isAdmin && (
                    <NavLink
                        href="/admin"
                        label="Admin"
                        icon={Shield}
                        active={pathname === "/admin"}
                        onClick={() => setMobileOpen(false)}
                    />
                )}
            </nav>

            <div className="p-3 border-t">
                <Link href="/listings/new" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full mb-2" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Listing
                    </Button>
                </Link>
                <div className="flex items-center justify-between">
                    <div className="text-sm">
                        <p className="font-medium">{user.displayName}</p>
                        <p className="text-xs text-muted-foreground">
                            @{user.username}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                        title="Logout"
                    >
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex">
            {/* Desktop sidebar */}
            <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:bg-card">
                {sidebar}
            </aside>

            {/* Mobile header + sheet */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="md:hidden flex items-center justify-between border-b px-4 py-3">
                    <Link href="/" className="font-bold">
                        Nest Finder
                    </Link>
                    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-60 p-0">
                            {sidebar}
                        </SheetContent>
                    </Sheet>
                </header>

                <main className="flex-1">{children}</main>

                {/* Mobile bottom nav */}
                <nav className="md:hidden flex items-center justify-around border-t bg-card py-2">
                    {NAV_ITEMS.slice(0, 4).map((item) => {
                        const active = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center gap-0.5 text-xs",
                                    active
                                        ? "text-primary"
                                        : "text-muted-foreground",
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
