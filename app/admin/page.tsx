"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, KeyRound } from "lucide-react";
import { PageWrapper } from "@/components/layout/page-wrapper";

interface AdminUser {
    id: string;
    username: string;
    displayName: string;
    isAdmin: boolean;
    createdAt: string;
    preferences: { onboardingComplete: boolean } | null;
}

export default function AdminPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [addOpen, setAddOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        username: "",
        password: "",
        displayName: "",
        isAdmin: false,
    });
    const [resetPasswordId, setResetPasswordId] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState("");

    function fetchUsers() {
        fetch("/api/admin/users")
            .then((res) => res.json())
            .then((data) => setUsers(data.users || []))
            .finally(() => setLoading(false));
    }

    useEffect(() => {
        fetchUsers();
    }, []);

    async function handleAddUser(e: React.FormEvent) {
        e.preventDefault();
        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newUser),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to add user");
            }
            toast.success("User added!");
            setAddOpen(false);
            setNewUser({
                username: "",
                password: "",
                displayName: "",
                isAdmin: false,
            });
            fetchUsers();
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to add user",
            );
        }
    }

    async function handleDeleteUser(id: string, username: string) {
        if (!confirm(`Delete user "${username}"? This cannot be undone.`))
            return;
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error);
            }
            toast.success("User deleted");
            fetchUsers();
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to delete user",
            );
        }
    }

    async function handleResetPassword(id: string) {
        if (!newPassword) return;
        try {
            await fetch(`/api/admin/users/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: newPassword }),
            });
            toast.success("Password reset!");
            setResetPasswordId(null);
            setNewPassword("");
        } catch {
            toast.error("Failed to reset password");
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    return (
        <PageWrapper>
            <div className="mx-auto max-w-3xl px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Admin Panel</h1>
                        <p className="text-muted-foreground">
                            Manage users and settings
                        </p>
                    </div>
                    <Dialog open={addOpen} onOpenChange={setAddOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Add User
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New User</DialogTitle>
                            </DialogHeader>
                            <form
                                onSubmit={handleAddUser}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="new-username">
                                        Username
                                    </Label>
                                    <Input
                                        id="new-username"
                                        value={newUser.username}
                                        onChange={(e) =>
                                            setNewUser({
                                                ...newUser,
                                                username: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">
                                        Password
                                    </Label>
                                    <Input
                                        id="new-password"
                                        type="password"
                                        value={newUser.password}
                                        onChange={(e) =>
                                            setNewUser({
                                                ...newUser,
                                                password: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-displayname">
                                        Display Name
                                    </Label>
                                    <Input
                                        id="new-displayname"
                                        value={newUser.displayName}
                                        onChange={(e) =>
                                            setNewUser({
                                                ...newUser,
                                                displayName: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="new-admin"
                                        checked={newUser.isAdmin}
                                        onCheckedChange={(c) =>
                                            setNewUser({
                                                ...newUser,
                                                isAdmin: c === true,
                                            })
                                        }
                                    />
                                    <Label htmlFor="new-admin">Admin</Label>
                                </div>
                                <Button type="submit" className="w-full">
                                    Create User
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="space-y-3">
                    {users.map((user) => (
                        <Card key={user.id}>
                            <CardContent className="flex items-center justify-between py-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold">
                                        {user.displayName[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">
                                                {user.displayName}
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                @{user.username}
                                            </span>
                                            {user.isAdmin && (
                                                <Badge
                                                    variant="default"
                                                    className="text-[10px]"
                                                >
                                                    Admin
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {user.preferences
                                                ?.onboardingComplete
                                                ? "Onboarding complete"
                                                : "Hasn't completed onboarding"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {resetPasswordId === user.id ? (
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="password"
                                                placeholder="New password"
                                                value={newPassword}
                                                onChange={(e) =>
                                                    setNewPassword(
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-40"
                                            />
                                            <Button
                                                size="sm"
                                                onClick={() =>
                                                    handleResetPassword(user.id)
                                                }
                                            >
                                                Save
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    setResetPasswordId(null);
                                                    setNewPassword("");
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() =>
                                                    setResetPasswordId(user.id)
                                                }
                                                title="Reset password"
                                            >
                                                <KeyRound className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() =>
                                                    handleDeleteUser(
                                                        user.id,
                                                        user.username,
                                                    )
                                                }
                                                title="Delete user"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </PageWrapper>
    );
}
