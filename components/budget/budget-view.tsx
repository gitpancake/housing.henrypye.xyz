"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    DollarSign,
    Save,
    Users,
    TrendingDown,
    TrendingUp,
    Calculator,
} from "lucide-react";
import { toast } from "sonner";
import {
    calculateTakeHome,
    calculateAffordableRent,
    type TakeHomeResult,
} from "@/lib/tax";

interface BudgetUser {
    id: string;
    displayName: string;
    preferences: {
        annualSalary: number | null;
        budgetMin: number;
        budgetMax: number;
    } | null;
}

interface BudgetViewProps {
    users: BudgetUser[];
    currentUserId: string;
}

function formatCurrency(amount: number): string {
    return `$${amount.toLocaleString()}`;
}

function TaxBreakdownCard({
    user,
    isCurrentUser,
    onSave,
}: {
    user: BudgetUser;
    isCurrentUser: boolean;
    onSave: (salary: number) => Promise<void>;
}) {
    const [salary, setSalary] = useState(
        user.preferences?.annualSalary?.toString() || "",
    );
    const [saving, setSaving] = useState(false);

    const salaryNum = parseInt(salary) || 0;
    const breakdown: TakeHomeResult | null =
        salaryNum > 0 ? calculateTakeHome(salaryNum) : null;

    async function handleSave() {
        const val = parseInt(salary);
        if (!val || val <= 0) {
            toast.error("Please enter a valid salary");
            return;
        }
        setSaving(true);
        try {
            await onSave(val);
            toast.success("Salary saved");
        } finally {
            setSaving(false);
        }
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    {user.displayName}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor={`salary-${user.id}`} className="text-xs">
                        Annual Salary (CAD)
                    </Label>
                    {isCurrentUser ? (
                        <div className="flex gap-2">
                            <Input
                                id={`salary-${user.id}`}
                                type="number"
                                value={salary}
                                onChange={(e) => setSalary(e.target.value)}
                                placeholder="e.g. 75000"
                                min={0}
                            />
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                size="sm"
                            >
                                <Save className="h-3.5 w-3.5 mr-1" />
                                {saving ? "..." : "Save"}
                            </Button>
                        </div>
                    ) : (
                        <p className="text-lg font-semibold">
                            {user.preferences?.annualSalary
                                ? formatCurrency(user.preferences.annualSalary)
                                : "Not set yet"}
                        </p>
                    )}
                </div>

                {breakdown && (
                    <div className="space-y-2 pt-2 border-t">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                                Federal Tax
                            </span>
                            <span className="text-red-600 dark:text-red-400">
                                -{formatCurrency(breakdown.federalTax)}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                                BC Provincial Tax
                            </span>
                            <span className="text-red-600 dark:text-red-400">
                                -{formatCurrency(breakdown.provincialTax)}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm font-medium pt-1 border-t">
                            <span className="text-muted-foreground">
                                Total Tax
                            </span>
                            <span className="text-red-600 dark:text-red-400">
                                -{formatCurrency(breakdown.totalTax)}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm pt-1">
                            <span className="text-muted-foreground">
                                Effective Tax Rate
                            </span>
                            <span>
                                {(
                                    (breakdown.totalTax / salaryNum) *
                                    100
                                ).toFixed(1)}
                                %
                            </span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                            <span>Annual Take-Home</span>
                            <span className="text-green-600 dark:text-green-400">
                                {formatCurrency(breakdown.annualTakeHome)}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold">
                            <span>Monthly Take-Home</span>
                            <span className="text-green-600 dark:text-green-400">
                                {formatCurrency(breakdown.monthlyTakeHome)}
                            </span>
                        </div>
                    </div>
                )}

                {!breakdown &&
                    !isCurrentUser &&
                    !user.preferences?.annualSalary && (
                        <p className="text-xs text-muted-foreground italic">
                            Waiting for {user.displayName} to enter their
                            salary.
                        </p>
                    )}
            </CardContent>
        </Card>
    );
}

export function BudgetView({ users, currentUserId }: BudgetViewProps) {
    const [budgetUsers, setBudgetUsers] = useState(users);

    const breakdowns = budgetUsers
        .map((u) => ({
            user: u,
            breakdown: u.preferences?.annualSalary
                ? calculateTakeHome(u.preferences.annualSalary)
                : null,
        }))
        .filter((b) => b.breakdown !== null);

    const combinedMonthlyTakeHome = breakdowns.reduce(
        (sum, b) => sum + b.breakdown!.monthlyTakeHome,
        0,
    );

    const affordableRent =
        combinedMonthlyTakeHome > 0
            ? calculateAffordableRent(combinedMonthlyTakeHome)
            : 0;

    // Get budget preferences from any user (they share budgetMin/budgetMax)
    const currentUser = budgetUsers.find((u) => u.id === currentUserId);
    const budgetMin = currentUser?.preferences?.budgetMin ?? 0;
    const budgetMax = currentUser?.preferences?.budgetMax ?? 0;

    async function handleSave(salary: number) {
        const res = await fetch("/api/budget", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ annualSalary: salary }),
        });
        if (!res.ok) throw new Error("Failed to save salary");

        setBudgetUsers((prev) =>
            prev.map((u) =>
                u.id === currentUserId
                    ? {
                          ...u,
                          preferences: u.preferences
                              ? { ...u.preferences, annualSalary: salary }
                              : {
                                    annualSalary: salary,
                                    budgetMin: 1500,
                                    budgetMax: 2500,
                                },
                      }
                    : u,
            ),
        );
    }

    function budgetBadge() {
        if (!affordableRent || !budgetMax) return null;

        if (budgetMax <= affordableRent) {
            return (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Within budget
                </Badge>
            );
        }
        if (budgetMax <= affordableRent * 1.15) {
            return (
                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                    Stretching it
                </Badge>
            );
        }
        return (
            <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                <TrendingDown className="h-3 w-3 mr-1" />
                Over budget
            </Badge>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold">Budget</h1>
                <p className="text-muted-foreground">
                    Calculate what you can afford based on take-home pay
                </p>
            </div>

            {/* Per-user salary cards */}
            <div className="grid gap-4 md:grid-cols-2">
                {budgetUsers.map((user) => (
                    <TaxBreakdownCard
                        key={user.id}
                        user={user}
                        isCurrentUser={user.id === currentUserId}
                        onSave={handleSave}
                    />
                ))}
            </div>

            {/* Combined affordability card */}
            {breakdowns.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            Combined Affordability
                            {budgetBadge()}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="rounded-lg bg-muted/50 p-4 text-center">
                                <p className="text-xs text-muted-foreground mb-1">
                                    Combined Monthly Take-Home
                                </p>
                                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                    {formatCurrency(combinedMonthlyTakeHome)}
                                </p>
                            </div>
                            <div className="rounded-lg bg-primary/5 border-2 border-primary/20 p-4 text-center">
                                <p className="text-xs text-muted-foreground mb-1">
                                    Affordable Rent (30%)
                                </p>
                                <p className="text-xl font-bold text-primary">
                                    {formatCurrency(affordableRent)}
                                </p>
                            </div>
                            <div className="rounded-lg bg-muted/50 p-4 text-center">
                                <p className="text-xs text-muted-foreground mb-1">
                                    Your Budget Range
                                </p>
                                <p className="text-xl font-bold">
                                    {formatCurrency(budgetMin)}-
                                    {formatCurrency(budgetMax)}
                                </p>
                            </div>
                        </div>

                        {breakdowns.length === 1 && budgetUsers.length > 1 && (
                            <p className="text-xs text-muted-foreground text-center italic">
                                Only showing one salary. Combined calculation
                                will update when both salaries are entered.
                            </p>
                        )}

                        {/* Rent tiers */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-2 pr-4 font-medium">
                                            % of Take-Home
                                        </th>
                                        <th className="text-right py-2 px-3 font-medium">
                                            Max Rent
                                        </th>
                                        <th className="text-right py-2 pl-3 font-medium">
                                            Guidance
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { pct: 25, label: "Conservative" },
                                        { pct: 30, label: "Recommended" },
                                        { pct: 33, label: "Sweet Spot" },
                                        { pct: 35, label: "Stretching" },
                                        { pct: 40, label: "Maximum" },
                                    ].map(({ pct, label }) => {
                                        const rent = Math.round(
                                            combinedMonthlyTakeHome *
                                                (pct / 100),
                                        );
                                        const colorClass =
                                            pct === 33
                                                ? "text-emerald-600 dark:text-emerald-400"
                                                : pct < 33
                                                  ? "text-green-400 dark:text-green-500"
                                                  : pct >= 40
                                                    ? "text-red-600 dark:text-red-400"
                                                    : "text-amber-500 dark:text-amber-400";
                                        return (
                                            <tr
                                                key={pct}
                                                className={`border-b last:border-0 ${pct === 33 ? "bg-primary/5 font-medium" : ""}`}
                                            >
                                                <td className="py-2.5 pr-4">
                                                    {pct}%
                                                </td>
                                                <td
                                                    className={`text-right py-2.5 px-3 tabular-nums font-semibold ${colorClass}`}
                                                >
                                                    {formatCurrency(rent)}
                                                </td>
                                                <td className="text-right py-2.5 pl-3 text-muted-foreground text-xs">
                                                    {label}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="rounded-lg border bg-muted/20 px-4 py-3">
                            <div className="flex items-start gap-2">
                                <Calculator className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                <p className="text-xs text-muted-foreground">
                                    Estimate based on BC + Federal income tax
                                    only. Does not include CPP, EI, or other
                                    deductions. Actual take-home may be lower.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
