"use client";

import { useEffect, useState } from "react";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { BudgetView } from "@/components/budget/budget-view";

interface BudgetUser {
  id: string;
  displayName: string;
  preferences: {
    annualSalary: number | null;
    budgetMin: number;
    budgetMax: number;
  } | null;
}

export default function BudgetPage() {
  const [users, setUsers] = useState<BudgetUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/budget").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ])
      .then(([budgetData, meData]) => {
        setUsers(budgetData.users || []);
        setCurrentUserId(meData.user?.id || "");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">Loading budget...</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <BudgetView users={users} currentUserId={currentUserId} />
    </PageWrapper>
  );
}
