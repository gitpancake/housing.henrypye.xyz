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
    Menu,
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
    { href: "/", label: "Dashboard" },
    { href: "/listings", label: "Listings" },
    { href: "/map", label: "Map", divider: true },
    { href: "/calendar", label: "Calendar" },
    { href: "/compare", label: "Compare" },
    { href: "/todos", label: "Tasks", divider: true },
    { href: "/budget", label: "Budget" },
    { href: "/profile", label: "Profile", divider: true },
];

const MOBILE_NAV = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/listings", label: "Listings", icon: List },
    { href: "/map", label: "Map", icon: MapIcon },
    { href: "/calendar", label: "Calendar", icon: CalendarDays },
];

export function AppShell({ children, user }: AppShellProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [mobileOpen, setMobileOpen] = useState(false);

    async function handleLogout() {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
    }

    function isActive(href: string) {
        return href === "/" ? pathname === "/" : pathname.startsWith(href);
    }

    const sidebar = (
        <div className="flex flex-col h-full bg-zinc-900 text-zinc-400">
            <div className="px-5 py-5">
                <h1 className="font-mono text-sm font-bold text-white tracking-tight">
                    nest finder.
                </h1>
            </div>

            <div className="flex flex-col gap-0.5 px-3 flex-1">
                {NAV_ITEMS.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                            "rounded-md px-3 py-2 text-sm transition-colors",
                            item.divider && "mt-2 pt-2 border-t border-zinc-800",
                            isActive(item.href)
                                ? "bg-zinc-800 text-white font-medium"
                                : "hover:bg-zinc-800/50 hover:text-zinc-200",
                        )}
                    >
                        {item.label}
                    </Link>
                ))}
                {user.isAdmin && (
                    <Link
                        href="/admin"
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                            "rounded-md px-3 py-2 text-sm transition-colors mt-2 pt-2 border-t border-zinc-800",
                            isActive("/admin")
                                ? "bg-zinc-800 text-white font-medium"
                                : "hover:bg-zinc-800/50 hover:text-zinc-200",
                        )}
                    >
                        Admin
                    </Link>
                )}
            </div>

            <div className="px-5 py-4 border-t border-zinc-800">
                <div className="text-xs text-zinc-500 mb-1">
                    {user.displayName}
                </div>
                <button
                    onClick={handleLogout}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    Sign out
                </button>
            </div>
        </div>
    );

    return (
        <div className="h-screen flex">
            {/* Desktop sidebar */}
            <aside className="hidden md:flex md:w-52 md:shrink-0 md:flex-col">
                {sidebar}
            </aside>

            {/* Mobile header + sheet */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="md:hidden flex items-center justify-between border-b border-zinc-200 px-4 py-3">
                    <Link
                        href="/"
                        className="font-mono text-sm font-bold tracking-tight"
                    >
                        nest finder.
                    </Link>
                    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-52 p-0">
                            {sidebar}
                        </SheetContent>
                    </Sheet>
                </header>

                <main className="flex-1 overflow-y-auto">{children}</main>

                {/* Mobile bottom nav */}
                <nav className="md:hidden flex items-center justify-around border-t border-zinc-200 bg-white py-2">
                    {MOBILE_NAV.map((item) => {
                        const active = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center gap-0.5 text-xs transition-colors",
                                    active
                                        ? "text-zinc-900"
                                        : "text-zinc-400",
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
