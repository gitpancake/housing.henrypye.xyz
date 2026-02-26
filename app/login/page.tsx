"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: username.toLowerCase(),
                    password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Login failed");
                setPassword("");
                return;
            }

            if (!data.user.onboardingComplete) {
                router.push("/onboarding");
            } else {
                router.push("/");
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
            <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
                <div className="text-center mb-6">
                    <h1 className="font-mono text-sm font-bold tracking-tight">
                        nest finder.
                    </h1>
                    <p className="text-xs text-zinc-400 mt-1">
                        Sign in to your apartment search
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="username"
                            className="block text-xs font-medium text-zinc-500 mb-1.5"
                        >
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                            autoComplete="username"
                            required
                            className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-400 transition-colors"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-xs font-medium text-zinc-500 mb-1.5"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            required
                            className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-400 transition-colors"
                        />
                    </div>
                    {error && (
                        <p className="text-xs text-red-500">{error}</p>
                    )}
                    <button
                        type="submit"
                        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        disabled={loading || !username || !password}
                    >
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>
            </div>
        </div>
    );
}
